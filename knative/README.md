# Knative Serving (exercise 5.6)

## Cluster

Knative needs a cluster without Traefik. A second k3d cluster was created next to
the existing one (`--flannel-backend=host-gw` because two k3d clusters cannot
share the host's vxlan setup):

```bash
k3d cluster create knative \
  --port 8084:30080@agent:0 -p 8083:80@loadbalancer \
  --agents 2 \
  --k3s-arg "--disable=traefik@server:0" \
  --k3s-arg "--flannel-backend=host-gw@server:0" \
  --image rancher/k3s:v1.34.1-k3s1
```

## Installation

```bash
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.20.0/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.20.0/serving-core.yaml
kubectl apply -f https://github.com/knative-extensions/net-kourier/releases/download/knative-v1.20.0/kourier.yaml
kubectl patch configmap/config-network -n knative-serving --type merge \
  -p '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.20.0/serving-default-domain.yaml
```

```text
$ kubectl get pods -n knative-serving
NAME                          READY   STATUS    RESTARTS   AGE
activator-f56b94b44-rt444     1/1     Running   0          60s
autoscaler-74d66ffcd-n2srz    1/1     Running   0          60s
controller-5d68d6d797-mcvsv   1/1     Running   0          60s
webhook-c47fc76d8-vj9rx       1/1     Running   0          60s
```

Magic DNS (sslip.io) resolved the domain to `172.19.0.2.sslip.io`.

## Deploying a service

`manifests/hello.yaml` deploys the helloworld sample:

```text
$ kubectl get ksvc
NAME    URL                                        READY
hello   http://hello.default.172.19.0.2.sslip.io   True

$ curl -H "Host: hello.default.172.19.0.2.sslip.io" http://localhost:8083
Hello World!
```

## Autoscaling

After two minutes of no traffic the revision scales to zero, and the next request
starts it again:

```text
$ kubectl get po -l serving.knative.dev/service=hello
No resources found in default namespace.

$ curl -H "Host: hello.default.172.19.0.2.sslip.io" http://localhost:8083
Hello World!

$ kubectl get po -l serving.knative.dev/service=hello
NAME                                      READY   STATUS    RESTARTS   AGE
hello-00001-deployment-85c5fdb9b5-qhqnf   2/2     Running   0          1s
```

## Traffic splitting

`manifests/hello-split.yaml` sends 50% of the traffic to each revision:

```text
$ for i in $(seq 40); do curl -s -H "Host: hello.default.172.19.0.2.sslip.io" http://localhost:8083; done | sort | uniq -c
World=20 Knative=20
```
