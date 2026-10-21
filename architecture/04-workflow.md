# 04 · Workflow — any bounded loop maps to a DAG

Each use case designs its own coding loop. The platform needs only one property: **every retry has a limit**, so the loop unrolls into a finite chain of steps — a directed acyclic graph (DAG). Each iteration runs as a new step with its own pod, so the declared graph never cycles back.

![A bounded loop unrolls into a DAG: plan, implement, review, open PR, with at most two review rounds, executed in Argo as plan, implement 1, review 1, implement 2, review 2, open PR](../images/loop-dag.svg)

## Why Argo Workflows

Every step is a container, so each agent in the loop — planner, coder, reviewer — gets its own image, tools, credentials and model. Argo Workflows runs that natively as a DAG on Kubernetes, and it's a CNCF graduated project. Rejected alternatives and their reasons: [ADR-004](./decisions/004-orchestration-argo-workflows.md).

## Stop conditions

They stack ([ADR-009](./decisions/009-stop-conditions.md)):

1. **Iteration cap** — always on. The cost ceiling.
2. **QA green** — the normal exit.
3. **Human escalation** — when the cap is hit without green.

Per loop, only the cap value and the definition of "green" change. Checkable gates (tests, lint) are code; judgment calls are instructions. Exit code 0 is not a success signal — every step emits an artifact and exits with one of a fixed set of outcomes.

## Example WorkflowTemplate

Simplified: a coding loop with a review round bounded by an attempt limit. One pod per step, one image per role ([ADR-010](./decisions/010-agent-images.md)).

```yaml
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: coding-loop
spec:
  entrypoint: main
  arguments:
    parameters:
      - name: issue # GitHub issue number
  templates:
    - name: main
      # Note: Argo syntax uses lists of lists, hence `- -`
      steps:
        - - name: plan
            template: agent
            arguments:
              parameters: [{ name: role, value: planner }]
        - - name: build
            template: implement-and-review
            arguments:
              parameters: [{ name: attempt, value: "1" }]
        - - name: open-pr
            template: open-pr

    # The loop: a template that calls itself, bounded by `attempt`
    - name: implement-and-review
      inputs:
        parameters: [{ name: attempt }]
      steps:
        - - name: implement
            template: agent
            arguments:
              parameters: [{ name: role, value: coder }]
        - - name: review
            template: agent
            arguments:
              parameters: [{ name: role, value: reviewer }]
        - - name: retry
            template: implement-and-review
            when: "'{{steps.review.outputs.parameters.verdict}}' == 'changes' && {{inputs.parameters.attempt}} < 2"
            arguments:
              parameters:
                - name: attempt
                  value: "{{=asInt(inputs.parameters.attempt) + 1}}"

    # One pod per step, image per role
    - name: agent
      inputs:
        parameters: [{ name: role }]
      outputs:
        parameters:
          - name: verdict
            valueFrom: { path: /tmp/verdict, default: none }
      retryStrategy: { limit: 2 } # infrastructure retries, not review rounds
      activeDeadlineSeconds: 3600
      container:
        image: registry.example.com/agents/{{inputs.parameters.role}}:1.0
        args: [--issue, "{{workflow.parameters.issue}}"]

    - name: open-pr
      container:
        image: registry.example.com/tools/open-pr:1.0
        args: [--issue, "{{workflow.parameters.issue}}"]
```

## Known sharp edges

Known and deferred.

- **Trigger filtering.** Firing on every `issue_comment` means the agent's own PR comment triggers another run. Needs an explicit opt-in — magic comment or label — in the workflow service.
- **Branch collisions.** Hardcoded branch names break on concurrent runs. Parameterize.
- **Prompt injection.** Issue text goes straight into the agent's prompt. On a public repo that is untrusted input — limited by the pod's downscoped, short-lived token and the [repo configuration](./reference/github-configuration.md), not removed.
- **Runaway cost.** Bounded by the iteration cap and `activeDeadlineSeconds`.
