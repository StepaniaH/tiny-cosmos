# Tiny Cosmos：通过 GitHub Actions 部署到 VPS

本仓库的部署流程沿用 Toolbox 的安全边界：普通 push 和 Pull Request 只校验静态站点；生产部署必须从 `main` 手动触发。部署时，GitHub Actions 会在干净的 Linux runner 上校验 JavaScript、组装短期 artifact，再经 Tailscale、SSH 和 rsync 把同一份 artifact 同步到 VPS。整个过程不需要从本机登录 VPS 或执行部署脚本。

## 1. VPS 首次准备

VPS 需要具备：

- 已安装 `rsync` 和 SSH server；
- 一个专门用于部署的非 root 用户；
- 一个只存放 Tiny Cosmos 静态文件的独立绝对目录，例如 `/home/<deploy-user>/www/tiny-cosmos`；
- 该用户对上述目录有读写权限；
- 如果 VPS 只通过 Tailscale 访问，主机已加入与 GitHub Actions OAuth client 相同的 tailnet。

不要把 `VPS_WWW` 指向 `/`、用户 home 或与其他站点共用的目录。工作流使用 `rsync --delete`，目标目录里不属于当前 artifact 的文件会被删除。

生成一把仅供 GitHub Actions 使用的 SSH key，把公钥加入 VPS 部署用户的 `~/.ssh/authorized_keys`。私钥只存入 GitHub Secret，不要提交到仓库。

如果 VPS 使用 Caddy，可以从 [`deploy/Caddyfile.example`](../deploy/Caddyfile.example) 复制站点块，替换域名和 Caddy 实际可见的静态目录后 reload Caddy。若 Caddy 在容器中运行，还需要把 `VPS_WWW` 以只读 volume 挂载到对应的容器路径。

## 2. GitHub production environment

在仓库的 **Settings → Environments** 新建 `production` environment，并限制只允许 `main` 分支部署。建议启用 Required reviewers，让生产同步前还有一层 GitHub 审批。

在这个 environment 中添加以下 Secrets。Tailscale 使用 GitHub OIDC 联邦身份，不再保存 OAuth client secret：

| Secret | 内容 |
| --- | --- |
| `TAILSCALE_OAUTH_CLIENT_ID` | Tailscale federated identity Client ID |
| `TAILSCALE_AUDIENCE` | Tailscale federated identity Audience |
| `VPS_SSH_KEY` | 专用部署私钥的完整内容 |
| `VPS_HOST` | Tailscale 主机名或 IP，不包含用户名 |
| `VPS_USER` | VPS 部署用户名 |
| `VPS_PORT` | SSH 端口 |
| `VPS_WWW` | 独立的远端静态目录，必须是绝对路径 |
| `VPS_HEALTHCHECK_URL` | 可选；部署后用来执行 HTTP 检查的完整 HTTPS URL |

在 Tailscale 管理后台创建 GitHub Actions federated identity，issuer 选择 GitHub Actions，subject 限定到本仓库，并授予 `auth_keys` 与 `tag:ci`。对应 ACL 应只给这个 tag 开放部署所需的 VPS SSH 端口，不要授予整个 tailnet 的宽泛访问权限。工作流只在部署 job 上申请 `id-token: write`，普通验证 job 没有该权限。

如果此前配置过 `TAILSCALE_OAUTH_CLIENT_SECRET`，确认新联邦身份部署成功后可以从 GitHub environment 和 Tailscale 后台撤销旧 OAuth credential。

## 3. 发布

部署工作流只接受远端 `main` 上已经提交的文件：

1. 先把准备发布的 `dev` 通过 Pull Request 合入 `main`，并确认 CI 通过。
2. 打开仓库的 **Actions → CI & Manual Deploy**。
3. 点击 **Run workflow**，分支选择 `main`。
4. 勾选 `deploy_production`，再点击运行。
5. 等待 `verify` 和 `deploy-vps` 都变绿；如果 environment 配置了 reviewer，中途需要在 GitHub 批准一次。
6. 打开站点，确认游戏加载、图片正常、浏览器控制台无新增错误；如果设置了 `VPS_HEALTHCHECK_URL`，基础 HTTP 检查会由工作流自动执行。

对 `dev`/`main` 的普通 push 不会自动覆盖生产站点。这样既免去了本地手动部署，又保留了与 Toolbox 相同的明确发布确认。

## 4. 回滚

不要改写 `main` 历史。对问题提交或 Pull Request 创建 revert commit，让它经过相同 CI 并进入 `main`，然后从 Actions 重新部署。若代码本身没有问题、只是网络或 VPS 临时失败，修复环境后直接重新运行同一个 `main` workflow 即可。
