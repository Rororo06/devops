# Exercise 5.5: Rancher vs OpenShift

Verdict: **Rancher is the better platform** for the kind of work done on this course.

## Why Rancher wins

- Rancher manages *any* conformant Kubernetes cluster (EKS, GKE, AKS, RKE2, k3s), so
  it is a multi-cluster control plane instead of yet another distribution you have to
  migrate onto. OpenShift wants you to run OpenShift.
- Same tooling everywhere: plain `kubectl`, plain manifests, plain Helm. Everything
  written in this repository (kustomize overlays, ArgoCD applications, Istio ambient,
  Knative) applies unchanged. OpenShift adds `oc`, `DeploymentConfig`, `Route`,
  `ImageStream`, `BuildConfig` - useful, but they are OpenShift-only concepts that
  you cannot take with you.
- Lightweight: k3s/k3d (the same project family used in this course) runs a cluster
  on a laptop in seconds. OpenShift's smallest realistic footprint is far bigger, and
  CRC/SNO still wants many gigabytes of RAM.
- Free and Apache-2.0 licensed with optional SUSE support. OpenShift is a paid
  subscription per node/core; OKD exists but lags and drops the support story that is
  the main reason to buy OpenShift.
- Composable: you pick Longhorn, Rancher Monitoring, Fleet, Neuvector or you pick
  something else entirely. OpenShift bundles its own registry, monitoring, logging,
  Service Mesh and Pipelines, and going off the bundle is friction.
- No SCC surprises. OpenShift's SecurityContextConstraints reject a large share of
  community Helm charts and images (random UID, no root) until you patch them - a
  real cost when you just want to run upstream software.

## What OpenShift is genuinely better at

- Opinionated, batteries-included enterprise platform: registry, CI (Tekton),
  GitOps (ArgoCD), logging, monitoring and RBAC/compliance defaults all supported by
  a single vendor.
- Stricter secure-by-default posture (SCC, SELinux, signed content) that satisfies
  regulated environments out of the box.
- Developer experience for "give me a URL from this source repo": `Route`,
  `BuildConfig`/S2I and the web console are more complete than Rancher's UI.
- Long, predictable lifecycle and certified operators from the OperatorHub.

## Conclusion

If the requirement is "one vendor, one supported bundle, audited defaults", OpenShift
is defensible. But for this course - heterogeneous clusters, upstream Kubernetes
knowledge that transfers, cheap local development, and freedom to pick Istio, ArgoCD,
Knative and NATS myself - Rancher (and its k3s/k3d lineage) is the better choice.
