# Exercise 5.2: Istio ambient mesh on k3d

Istio 1.27.1 ambient profile installed into the local k3d cluster and validated with the
Bookinfo sample application.

## Install

```bash
istioctl install --set profile=ambient \
  --set values.global.platform=k3s \
  --set values.cni.cniBinDir=/bin \
  --skip-confirmation
```

`cniBinDir=/bin` is required on k3d: k3s looks up CNI plugins from `/bin` on the node, so the
default `/opt/cni/bin` location leaves the node with a CNI config that references a missing
`istio-cni` binary and every new pod fails with
`failed to find plugin "istio-cni" in path [/bin]`.

Two other k3d-specific problems were hit during the installation:

- `istio-cni-node` crashed with `watcher create: too many open files`. Fixed by raising the host
  inotify limits: `sysctl -w fs.inotify.max_user_instances=1024 fs.inotify.max_user_watches=1048576`.
- The failed sandbox creations leaked flannel IPAM reservations
  (`no IP addresses available in range set: 10.42.x.1-10.42.x.254`). Stale files under
  `/var/lib/cni/networks/cbr0` on each node whose container id is no longer in `crictl pods -q`
  were removed.

## Sample application

```bash
kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml
kubectl apply -f samples/bookinfo/gateway-api/bookinfo-gateway.yaml
kubectl apply -f samples/curl/curl.yaml
kubectl annotate gateway bookinfo-gateway networking.istio.io/service-type=ClusterIP --overwrite
kubectl label namespace default istio.io/dataplane-mode=ambient
istioctl waypoint apply --namespace default --enroll-namespace
kubectl apply -f manifests/productpage-authorizationpolicy.yaml
kubectl apply -f manifests/bookinfo-reviews-route.yaml
```

## Observations

- Through the gateway the product page answers normally
  (`<title>Simple Bookstore App</title>`).
- After the authorization policy is applied, a request straight from the `curl` pod to
  `productpage:9080` is rejected by ztunnel (curl exit code 56), while the gateway is still
  allowed: the L4 authorization is enforced by the ambient data plane, not by the application.
- With the waypoint enrolled, the `reviews` HTTPRoute splits the traffic 90/10 between
  `reviews-v1` and `reviews-v2`. 50 requests through the gateway gave `v1=43 v2=7`.

## Kiali

The addon is installed from `samples/addons/kiali.yaml` with the Prometheus URL pointing to the
Prometheus that was installed in exercise 4.3:

```yaml
prometheus:
  enabled: true
  url: http://prom-prometheus-server.prometheus:80
```

```bash
istioctl dashboard kiali
```
