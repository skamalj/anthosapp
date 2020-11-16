/* eslint-disable max-len */
export default
Vue.component('customnetworkpolicy',
    {
      data: function() {
        return {
          namespaceselector: '',
          clusterselector: '',
          networkpolicyname: '',
          policypodselectorkey: '',
          policypodselectorvalue: '',
          rules: [],
          ruletype: 'ingress',
          ruledeftype: 'ipblock',
          allowcidr: '',
          exceptcidr: '',
          nslabelkey: '',
          nslabelval: '',
          nspodlabelkey: '',
          nspodlabelval: '',
          podlabelkey: '',
          podlabelval: '',
        };
      },
      props: ['nscontext', 'repoName'],
      methods: {
        addNewRule: function() {
          const newRule = {};
          newRule['ruletype'] = this.ruletype;
          if (this.ruledeftype == 'ipblock') {
            newRule['ipblock'] = true;
            newRule['allowcidr'] = this.allowcidr;
            newRule['exceptcidr'] = this.exceptcidr;
          } else if ( this.ruledeftype == 'namespaceselector' ) {
            newRule['namespaceselector'] = true;
            newRule['nslabelkey'] = this.nslabelkey;
            newRule['nslabelval'] = this.nslabelval;
            newRule['podlabelkey'] = this.nspodlabelkey;
            newRule['podlabelval'] = this.nspodlabelval;
          } else if ( this.ruledeftype == 'podselector' ) {
            newRule['podselector'] = true;
            newRule['podlabelkey'] = this.podlabelkey;
            newRule['podlabelval'] = this.podlabelval;
          }
          this.rules.splice(0, 0, newRule);
        },
        createNetworkPolicy() {
          const vueObj = this;
          const formData = new FormData();
          formData.append('nscontext', JSON.stringify(vueObj.nscontext));
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/createNetworkPolicy',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(response) {
            globalobj.appendLog(response.data);
            vueObj.refreshClusterTree();
            vueObj.networkpolicyname= '';
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshClusterTree() {
          this.$parent.$refs.namespacetree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <h5><span class="badge badge-default">Selectors:</span></h5> 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector"  v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Namespace Selector"  v-model:value="namespaceselector"> \
            </div> \
            <h5><span class="badge badge-default">Policy Spec:</span></h5>
            <div  class="container m-3">
                <input  class="form-control" type="text" placeholder="Policy Name"  v-model:value="networkpolicyname"> \           
              <div class="row mt-3">
                <div  class="col-5 m-1">
                    <input  class="form-control" type="text" placeholder="Pod Selector Key"  v-model:value="policypodselectorkey"> \
                </div> \ 
                <div  class="col-5 m-1">
                    <input  class="form-control" type="text" placeholder="Pod Selector Value"  v-model:value="policypodselectorvalue"> \
                </div> \ 
              </div>  
            </div> \ 
            <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5>
            <h5><span class="badge badge-default">Rules:</span></h5> 
            <div  class="container border m-3"> \
              <div class="row m-1">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="ruletype" v-model="ruletype" id="IngressRuleTypeId" value="ingress">
                  <label class="form-check-label" for="IngressRuleTypeId">Ingress</label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="ruletype" v-model="ruletype" id="EgressRuleTypeId" value="egress">
                  <label class="form-check-label" for="EgressRuleTypeId">Egress</label>
                </div>
                <div class="col-1 m-0 p-0" v-on:click="addNewRule">  
                  <button type="button m-0 p-0" class="btn btn-light" >
                    <i class="fa fa-plus" aria-hidden="true"></i>
                  </button>
                </div> 
              </div>    
              <div class="row m-1">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="ruledeftype" v-model="ruledeftype" id="IpblockRuleDefId" value="ipblock">
                  <label class="form-check-label" for="IIpblockRuleDefId">IP Block</label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="ruledeftype" v-model="ruledeftype" id="NamespaceRuleDefId" value="namespaceselector">
                  <label class="form-check-label" for="NamespaceRuleDefId">Namespace Selector</label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="ruledeftype" v-model="ruledeftype" id="PodRuleDefId" value="podselector">
                  <label class="form-check-label" for="PodRuleDefId">Pod Selector</label>
                </div>
              </div>  
              <div class="row m-1" v-if="ruledeftype == 'ipblock'">
                <div class="col-6 p-1">
                <input  class="form-control" type="text" placeholder="Allow Ip CIDR" v-model="allowcidr">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Except Ip CIDR"  v-model="exceptcidr">
                </div>  
              </div>
              <div class="row m-1" v-if="ruledeftype == 'namespaceselector'">
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Namespace Label Key" v-model="nslabelkey">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Namespace Label Value"  v-model="nslabelval">
                </div>  
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Pod Label Key" v-model="nspodlabelkey">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Pod Label Value"  v-model="nspodlabelval">
                </div>  
              </div>
              <div class="row m-1" v-if="ruledeftype == 'podselector'">
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Pod Label Key" v-model="podlabelkey">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Pod Label Value"  v-model="podlabelval">
                </div>  
              </div>
            </div>    
            <template v-for="(rule, index) in rules">
              <div  class="row  d-flex m-3 p-0"> \
                <pre class="border col-10">{{ rule }}</pre>
                <div class="col-1 m-0 p-0">  
                  <button type="button m-0 p-0" class="btn btn-light" v-on:click="rules.splice(index,1)">
                    <i class="fa fa-minus" aria-hidden="true"></i>
                  </button>
                </div>           
              </div> \
            </template>  
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="createNetworkPolicy()" 
                :disabled="!(rules.length > 0 && networkpolicyname && nscontext)">Submit</button> \
            </div>  
        </div>`,
    },
);
