/* eslint-disable max-len */
export default
Vue.component('defaultnetworkpolicy',
    {
      data: function() {
        return {
          clusterselector: '',
          defaultpolicylist: [],
        };
      },
      props: ['nscontext', 'repoName'],
      methods: {
        createDefaultNetworkPolicy() {
          const vueObj = this;
          for (const policytype of vueObj.defaultpolicylist) {
            const formData = new FormData();
            formData.append('nscontext', vueObj.nscontext);
            formData.append('policytype', policytype);
            axios.post('/createDefaultNetworkPolicy',
                formData,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                },
            ).then(function(response) {
              globalobj.appendLog(response.data);
            })
                .catch(function(err) {
                  window.alert(err);
                });
          }
        },
        refreshClusterTree() {
          this.$parent.$refs.namespacetree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector" v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3">
              <div class="form-check mb-3">
                  <input class="form-check-input" type="checkbox" v-model="defaultpolicylist" value="default-deny-all-egress" id="denyallegress">
                  <label class="form-check-label" for="denyallegress">
                      Deny All Egress
                  </label>
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" v-model="defaultpolicylist" value="default-deny-all-ingress" id="denyallingress">
                <label class="form-check-label" for="denyallingress">
                    Deny All Ingress
                </label>
              </div>
              <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5>
            </div>
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="createDefaultNetworkPolicy()" 
                :disabled="!(defaultpolicylist.length > 0 && nscontext)">Submit</button> \
            </div> 
        </div>`,
    },
);
