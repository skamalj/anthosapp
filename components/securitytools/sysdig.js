/* eslint-disable max-len */
export default
Vue.component('sysdig',
    {
      data: function() {
        return {
          clusterselector: '',
          access_key: '',
        };
      },
      props: ['nscontext', 'repoName'],
      methods: {
        createResourceQuotas() {
          const vueObj = this;
          const formData = new FormData();
          formData.append('nscontext', vueObj.nscontext);
          formData.append('repoName', globalobj.selected);
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/setupSysdig',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(response) {
            globalobj.appendLog(response.data);
            vueObj.refreshClusterTree();
            vueObj.access_key = '';
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshClusterTree() {
          this.$parent.$refs.securitytoolstree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector"  v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Access Key"  v-model:value="access_key"> \
            </div> \ 
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="createResourceQuotas()" 
                :disabled="!(nscontext && access_key)">Submit</button> \
            </div>  
            <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5> 
        </div>`,
    },
);
