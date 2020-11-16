/* eslint-disable max-len */
export default
Vue.component('resourcequotas',
    {
      data: function() {
        return {
          clusterselector: '',
          namespaceselector: '',
          resourcequotasname: '',
          cpulimit: '',
          memorylimit: '',
          limitnoofjobs: '',
          limitnoofpods: '',
        };
      },
      props: ['nscontext', 'repoName'],
      methods: {
        createResourceQuotas() {
          const vueObj = this;
          const formData = new FormData();
          formData.append('nscontext', vueObj.nscontext);
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/createResourceQuotas',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(response) {
            globalobj.appendLog(response.data);
            vueObj.refreshClusterTree();
            vueObj.cpulimit = '';
            vueObj.memorylimit = '';
            vueObj.limitnoofjobs = '';
            vueObj.limitnoofpods = '';
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
            <h5><span class="badge badge-default">Selector:</span></h5> 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector"  v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Namespace Selector"  v-model:value="namespaceselector"> \
            </div> \
            <h5><span class="badge badge-default">Quota Definition:</span></h5>
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Resource Quotas name"  v-model:value="resourcequotasname"> \
            </div> \ 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="CPU Limit (Ex. 2)"  v-model:value="cpulimit"> \
            </div> \ 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Memory Limit (2Gi or 2000m)"  v-model:value="memorylimit"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Limit No. of Pods"  v-model:value="limitnoofpods"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Limit No. of Jobs"  v-model:value="limitnoofjobs"> \
            </div> \   
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="createResourceQuotas()" 
                :disabled="!(nscontext && resourcequotasname && (cpulimit || memorylimit || limitnoofpods || limitnoofjobs))">Submit</button> \
            </div>  
            <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5> 
        </div>`,
    },
);
