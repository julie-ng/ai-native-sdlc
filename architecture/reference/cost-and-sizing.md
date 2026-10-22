# Cost and sizing

2026-10-22 operating choices. Design notes, not an ADR or a verified deployment. Minimize idle spend first; measure workload demand before adding capacity.

## Target design: scale to zero

- **Scale to zero** for eligible idle user-node capacity. Not implemented for the POC, like the [egress firewall](../02-architecture.md#design-decisions).
- Node scaling and application wake-up are separate mechanisms. With platform services and Argo running, Argo can create a pending agent pod and the cluster autoscaler can provision an agent node. No additional application wake-up service is needed for that case. [AKS autoscaler](https://learn.microsoft.com/en-us/azure/aks/cluster-autoscaler-overview).
- Scaling the platform application itself to zero removes its webhook receiver. Persistent desired replicas also prevent a platform pool staying at zero when those replicas require its nodes. Fully idle platform capacity needs a separately designed event, schedule or manual wake-up path; that mechanism remains open.
- A running AKS cluster still needs its system pool. **Scale to zero is not cluster stop/start.** [User pools to zero](https://learn.microsoft.com/en-us/azure/aks/scale-cluster#scale-user-node-pools-to-0), [AKS stop/start](https://learn.microsoft.com/en-us/azure/aks/start-stop-cluster).

## POC: minimum one, cluster start/stop

- **No scale to zero in the POC.** Keep each pool at minimum 1 / maximum 2 while the cluster runs.
- Use cluster start/stop to reduce idle-hour compute costs. Automatic shutdown outside a limited working-hours window is planned; schedule, restart mechanism and automation remain unverified.
- Accept paying for idle nodes during active hours to avoid application wake-up infrastructure in this POC. A stopped platform cannot process issue webhooks.
- These are selected settings, not evidence of what is deployed:

| Pool | VM size | Per-node resources |
|---|---|---|
| System | `Standard_D2s_v5` | 2 vCPU, 8 GiB |
| Platform | `Standard_D2s_v5` | 2 vCPU, 8 GiB |
| Agents | `Standard_D4s_v5` | 4 vCPU, 16 GiB |

> [!IMPORTANT]
> **System-pool compatibility is unverified.** Microsoft's current [system-pool reference](https://learn.microsoft.com/en-us/azure/aks/use-system-pools#system-and-user-node-pools) lists at least 4 vCPUs per node and two system nodes, while other AKS examples still show one node. Confirm acceptance and support for the selected D2s / single-node system pool; do not silently treat it as verified or substitute another SKU in these notes.

## Uniform agent resource profile

Initial main-container profile for planner, coder and reviewer; not calibrated against real coding runs:

| Resource | Request | Limit |
|---|---|---|
| CPU | 1 core | 2 cores |
| Memory | `2Gi` | `2Gi` |

- Covers Goose and child processes inside the agent container. Argo helper containers add their own requests and limits to the pod.
- Requests determine scheduling; the CPU limit allows spare capacity, not two dedicated cores. Memory limit violations can cause OOM termination. [Kubernetes resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).
- Builds/tests may need more memory. Image disk footprint does not establish runtime RAM demand; no real coding-run resource profile has been measured here.
- **Approximate capacity:** one agent pod on D2s; up to three on D4s, conditional on actual node-level and helper-container requests. Two concurrent agents per D4s is a suggested initial cap, not an implemented setting.
- D4s has 3.86 CPU after AKS's documented 140m reservation, before node-level pod requests. Using an illustrative Argo helper request of 100m CPU / 64 MiB, three pods request 3.3 CPU / approximately 6.2 GiB, leaving 560m CPU for node-level pods. These are planning calculations, not observed capacity. [AKS reservations](https://learn.microsoft.com/en-us/azure/aks/node-resource-reservations), [Argo executor example](https://argo-workflows.readthedocs.io/en/latest/cost-optimisation/#configure-executor-resource-requests).

## Cost posture and rough budget

Quoted rates, not a verified regional price: D2s $0.115/hour; D4s $0.230/hour. Estimates assume the selected system-pool configuration is usable.

| Configuration | Nodes | Hourly | 730 hours | Illustrative 176 hours |
|---|---:|---:|---:|---:|
| One node per pool | 3 | $0.460 | $335.80 | $80.96 |
| Two nodes per pool | 6 | $0.920 | $671.60 | $161.92 |

- Be conservative with spending and savings claims: start small, cap pool growth, and budget continuous uptime until shutdown is proven. Do not claim target-design scale-to-zero savings for the POC.
- 176 hours = 8 hours × 22 working days; not an agreed schedule. Billable uptime includes provisioning and shutdown delays.
- Node compute only. Disks, registry, PostgreSQL, networking, logs, model API usage and any control-plane tier charges are additional. Stopping AKS does not stop external services; pool maxima are not a total-spend cap.
- Observe actual billed hours, complete Azure spend, peak memory, CPU contention, OOMs, pending pods and check durations before revising the sizing. No long-term compute pricing commitment assumed.

## Decision log

| Date/context | Decision and reasoning |
|---|---|
| 2026-10-22 POC sizing | Select D2s system/platform pools and a D4s agent pool, each min 1 / max 2. Keep costs low and learn from real runs; system-pool compatibility remains unverified. |
| 2026-10-22 agent profile | Use the same 1 CPU / 2 GiB request and 2 CPU / 2 GiB limit for every role; avoid role-specific tuning before measurements. |
| 2026-10-22 wake-up discussion | Keep **scale to zero** as the target design, deferred for the POC like the egress firewall. Use min-one pools and cluster start/stop for the POC; accept active-hour idle capacity rather than build a platform wake-up path now. |
| 2026-10-22 recording | Keep evolving notes and unverified estimates here; no new ADR yet. Shutdown automation and achieved savings still need verification. |
