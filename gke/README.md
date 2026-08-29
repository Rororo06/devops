# GKE manifests

The manifests in this directory are the cloud counterparts of the local k3d
manifests. They expect the application images to be available in a registry
that the GKE nodes can pull from, so build and push them first and set the
image in the deployments accordingly.

```bash
gcloud container clusters create dwk-cluster --zone=europe-north1-b \
  --cluster-version=1.36 --disk-size=32 --num-nodes=4 --machine-type=e2-small

kubectl apply -f manifests/namespaces.yaml
kubectl apply -f ping-pong/manifests/ -f log_output/manifests/
```

Exercise 3.1 exposes Ping-pong with a LoadBalancer service:

```bash
kubectl apply -f gke/ping-pong-loadbalancer.yaml
kubectl get svc -n exercises ping-pong-lb-svc --watch
```

Exercise 3.2 switches the services to NodePort and routes both applications
through an Ingress:

```bash
kubectl apply -f gke/services-nodeport.yaml -f gke/ingress.yaml
kubectl get ing -n exercises
```

Exercise 3.3 and 3.4 replace the Ingress with the Gateway API, where the
`/pingpong` prefix is rewritten to the root path of the Ping-pong application:

```bash
gcloud container clusters update dwk-cluster --location=europe-north1-b --gateway-api=standard
kubectl apply -f gke/services-clusterip.yaml -f gke/gateway.yaml -f gke/route.yaml
```

For a local k3d cluster the same Gateway and HTTPRoute work with Envoy Gateway
once Traefik is disabled:

```bash
k3d cluster create --agents 2 -p 8081:80@loadbalancer --port 8082:30080@agent:0 \
  --k3s-arg '--flannel-backend=host-gw@server:*' --k3s-arg '--disable=traefik@server:0'
kubectl apply --server-side -f https://github.com/envoyproxy/gateway/releases/latest/download/install.yaml
kubectl apply -f gke/gateway-envoy.yaml -f gke/route.yaml
```
