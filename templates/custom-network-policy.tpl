kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: {{ POLICY_NAME }}
spec:
  {{#if POLICY_POD_SELECTOR_KEY }}
  podSelector:
    matchLabels:
      {{ POLICY_POD_SELECTOR_KEY }}:  {{ POLICY_POD_SELECTOR_VALUE }}
  {{else}}
  podSelector: {}    
  {{/if}}    
  policyTypes:
  {{#if INGRESS }}
  - Ingress
  {{/if}}
  {{#if EGRESS }}
  - Egress
  {{/if}}
  {{#if INGRESS }}
  ingress:
  - from:
    {{#each INGRESS }}
    {{#if this.ipblock }}
    - ipBlock:
        cidr: {{ this.allowcidr }}
        {{#if this.exceptcidr }}
        except:
        -   {{ this.exceptcidr }}
        {{/if}}
    {{/if}}   
    {{#if this.namespaceselector }}
    - namespaceSelector:
        matchLabels: 
          {{ this.nslabelkey }}: {{ this.nslabelval }}
      {{#if this.podlabelkey }}    
      podSelector:
        matchLabels:
          {{ this.podlabelkey }}: {{ this.podlabelval }}
      {{/if}}    
    {{/if}} 
    {{#if this.podselector }}
    - podSelector:
        matchLabels:
          {{ this.podlabelkey }}: {{ this.podlabelval }}
    {{/if}}
    {{/each}} 
    {{/if}}
    {{#if EGRESS }}
  egress:
  - to:
    {{#each EGRESS }}
    {{#if this.ipblock }}
    - ipBlock:
        cidr: {{ this.allowcidr }}
        {{#if this.exceptcidr }}
        except:
        -   {{ this.exceptcidr }}
        {{/if}}
    {{/if}}   
    {{#if this.namespaceselector }}
    - namespaceSelector:
        matchLabels: 
          {{ this.nslabelkey }}: {{ this.nslabelval }}
      podSelector:
        matchLabels:
          {{ this.podlabelkey }}: {{ this.podlabelval }}
    {{/if}} 
    {{#if this.podselector }}
    - podSelector:
        matchLabels:
          {{ this.podlabelkey }}: {{ this.podlabelval }}
    {{/if}}
    {{/each}}
    {{/if}}
  