/* eslint-disable max-len */
export default
Vue.component('generalpolicyobjects',
    {
      data: function() {
        return {
          policytypes: [
            {name: 'K8sContainerLimits', desc: 'Mandates specifying limits in containers and witihin specified values'},
            {name: 'K8sRequiredLabels', desc: 'Mandates specifying specified  label key, value to k8s objects'},
          ],
          selectedpolicytype: '',
          policylist: [],
          param1: '',
          param2: '',
          param3: '',
          param4: '',
          param5: '',
        };
      },
      methods: {
        addNewPolicy: function(newpolicy) {
          this.policylist.splice(0, 0, newpolicy);
          this.param1 = '';
          this.param2 = '';
          this.param3 = '';
          this.param4 = '';
          this.param5 = '';
        },
        createPolicies() {
          vueObj = this;
          this.repoName = globalobj.selected;
          const formData = new FormData();
          formData.append('policylist', JSON.stringify(this.policylist));
          axios.post('/createGeneralOPAPolicies',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.appendLog(resp.data);
            vueObj.refreshClutserTree();
            vueObj.clusterselectorname = '';
            vueObj.labelrows = [];
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshClutserTree() {
          this.$parent.$refs.clusterdirtree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <div class="form-group m-3 p-1">     
              <select v-model="selectedpolicytype" class="form-control">
                <option hidden value=""> Select Policy Type</option>
                <option v-for="policy in policytypes" :value="policy.name">{{ policy.name }}: {{ policy.desc }}</option>
              </select>
            </div>

            <!-- This below is constraint form for containerlimits template -->
            <div class="row m-3" v-if="selectedpolicytype == 'K8sContainerLimits'">
                <div class="col-12 p-1">
                    <input  class="form-control" type="text" placeholder="Constraint Name" v-model="param1">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="API Group['','apps']" v-model="param2">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Object Kind ['pods','deployments']"  v-model="param3">
                </div>  
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="CPU Limit" v-model="param4">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Except Ip CIDR"  v-model="param5">
                </div>  
                <div class="col-12 d-flex m-3 justify-content-end"> \
                  <button type="button" class="btn btn-dark" v-on:click="addNewPolicy({name: param1, 
                    type: selectedpolicytype, apigroup: param2, kind: param3, memorylimit: param4, cpulimit: param5})"
                    :disabled="!(param1 && param3 && param4 && param5)"> \
                        Add
                  </button> \
                </div> 
            </div>  

            <!-- Constraint form for RequiredLabels template -->
            <div class="row m-3" v-if="selectedpolicytype == 'K8sRequiredLabels'">
                <div class="col-12 p-1">
                    <input  class="form-control" type="text" placeholder="Constraint Name" v-model="param1">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="API Group['','apps']" v-model="param2">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Object Kind ['pods','deployments']"  v-model="param3">
                </div>  
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Label Key" v-model="param4">
                </div>
                <div class="col-6 p-1">
                  <input  class="form-control" type="text" placeholder="Label Value Regex"  v-model="param5">
                </div>  
                <div class="col-12 d-flex m-3 justify-content-end"> \
                  <button type="button" class="btn btn-dark" v-on:click="addNewPolicy({name: param1, 
                    type: selectedpolicytype, apigroup: param2, kind: param3, labelkey: param4, labelregex: param5})"
                    :disabled="!(param1 && param3 && param4 && param5)"> \
                        Add
                  </button> \
                </div> 
            </div>  
            <template v-for="(policy, index) in policylist">
              <div  class="row  d-flex m-3 p-0"> \
                <pre class="border col-10">{{ policy }}</pre>
                <div class="col-1 m-0 p-0">  
                  <button type="button m-0 p-0" class="btn btn-light" v-on:click="policylist.splice(index,1)">
                    <i class="fa fa-minus" aria-hidden="true"></i>
                  </button>
                </div>           
              </div> \
            </template> 
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="createGeneralOPAPolicies()" 
                v-if="policylist.length > 0">Submit</button> \
            </div> 
        </div>`,
    },
);
