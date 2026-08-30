# Exercise 5.8: CNCF Landscape

Annotated image: `landscape-annotated.png`

- **Green circles** — projects/products I have used directly (I knew I was using them).
- **Orange circles** — projects/products that something I used depends on, and which are
  not already circled green.

## Used directly

| Project | Where |
| --- | --- |
| Kubernetes | Every exercise of this course. |
| k3s / k3d | The local clusters used for all exercises (`k3d cluster create`). |
| Helm | Installing Prometheus (chapter 2/4) and NATS. |
| Prometheus | Chapter 4 metrics, the StatefulSet pod query, and the Argo Rollouts CPU AnalysisTemplate. |
| Grafana | Viewing metrics/dashboards together with Prometheus and Loki. |
| Grafana Loki | Log queries in chapter 4. |
| Argo CD | GitOps deployments of log output and the project (exercises 4.7–4.10). |
| Argo Rollouts | Canary release of ping-pong with automated analysis (exercise 4.4). |
| NATS | The broadcaster service in exercise 4.6. |
| Istio | Ambient mesh, Bookinfo sample, greeter traffic split (exercises 5.2–5.3). |
| Envoy | Istio waypoint/ingress gateways and Envoy Gateway used for the Gateway API. |
| Knative | Serving on a Traefik-less k3d cluster and ping-pong as a Knative Service (5.6–5.7). |
| Kourier | Knative networking layer. |
| PostgreSQL | Ping-pong and todo-backend databases (StatefulSet and Cloud SQL). |
| Docker | Building and running every image in the course. |
| containerd | The container runtime of the k3d/k3s nodes (used through `crictl` when debugging CNI IPAM). |
| Kustomize | All manifests, overlays and the GitOps configuration repository. |
| GitHub Actions | CI/CD pipelines building images and updating the config repository. |
| GitHub Container Registry / Docker Hub | Image registries for the CI pipelines. |
| Google Kubernetes Engine | Chapter 3 exercises. |
| Traefik | Default k3s ingress controller used for the ingress exercises in chapter 1–2. |
| Git / GitHub | The application repository and the separate configuration repository. |

## Used indirectly (dependencies of the above)

| Project | Why it was involved |
| --- | --- |
| Flannel | k3d → k3s default CNI; I only noticed it when its IPAM ran out of addresses and I had to clear stale reservations under `/var/lib/cni/networks/cbr0`. |
| CNI (plugins) | Istio installs `istio-cni` as a CNI plugin next to flannel's plugins. |
| CoreDNS | Bundled with k3s; every fully qualified service name (`postgres-svc.exercises.svc.cluster.local`) is resolved by it. |
| ztunnel | Istio ambient's node proxy; it produced the 503s I debugged in exercise 5.3. |
| Kiali | Shipped with the Istio samples for visualising the mesh (installed as an Istio addon). |
| gRPC | Used between Knative/Istio components (activator ↔ autoscaler, xDS between istiod and proxies). |
| Prometheus client libraries / OpenMetrics | Exposed by kube-state-metrics, node-exporter and Argo components that I scraped. |
| Kubernetes Gateway API | CRDs installed for Istio ambient and Envoy Gateway. |
| runc | Under containerd on every node. |
| SPIFFE/SPIRE-style identity (Istio mTLS certificates) | Istio ambient issues workload identities automatically for mTLS. |
| Knative Eventing components' cloudevents | Pulled in by the Knative Serving install manifests. |
| OCI image spec / distribution | Every `docker build`, `k3d image import` and registry push. |
| Cloud SQL / GCP load balancing | Behind the GKE exercises. |
| Rancher | k3s and k3d are Rancher projects, so all local clusters depend on Rancher's work. |
| etcd | The control plane datastore of the managed GKE clusters used in chapter 3 (locally k3s uses kine/SQLite instead). |

Following the chain deeper (e.g. containerd → runc → Linux cgroups) stops being
meaningful, so the list ends at the level above.

## Not circled

Some of the entries above have no logo of their own in the landscape image and
therefore could not be circled: k3s/k3d, Kustomize, Kourier, GitHub Container
Registry, Google Kubernetes Engine, Rancher, ztunnel and the Gateway API. Argo CD
and Argo Rollouts share the single "Argo" logo, and Docker is represented through
its parts (containerd, Distribution).
