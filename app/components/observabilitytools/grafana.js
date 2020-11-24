/* eslint-disable max-len */
export default
Vue.component('grafana',
    {
      data: function() {
        return {
          clusterselector: '',
          namespaceselector: '',
          storagesize: '',
          serviceport: '',
          runasuserid: '',
          cpulimit: '',
          memorylimit: '',
          username: '',
          password: '',
        };
      },
      props: ['nscontext', 'repoName'],
      methods: {
        setupGrafana() {
          const vueObj = this;
          const formData = new FormData();
          formData.append('nscontext', vueObj.nscontext);
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/setupGrafana',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(response) {
            globalobj.appendLog(response.data);
            vueObj.refreshClusterTree();
            vueObj.storagesize  = '';
            vueObj.serviceport  = '';
            vueObj.runasuserid  =  '';
            vueObj.cpulimit     = '';
            vueObj.memorylimit  = '';
            vueObj.username     = '';
            vueObj.password     = '';
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshClusterTree() {
          this.$parent.$refs.observetoolstree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector"  v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Namespace Selector"  v-model:value="namespaceselector"> \
            </div> \
            <div  class="container m-3"> \
              <div class="row m-0 p-0">
                <div class="col-4 m-0 p-0 pr-2">
                  <input  class="form-control" type="text" placeholder="PV Storage Size (10Gi)"  v-model:value="storagesize"> \
                </div>
                <div class="col-4 m-0 p-0 pr-2">
                  <input  class="form-control" type="text" placeholder="RUN As User ID (472)"  v-model:value="runasuserid"> \
                </div>
                <div class="col-4 m-0 p-0">
                  <input  class="form-control" type="text" placeholder="Service Port (80)"  v-model:value="serviceport"> \
                </div>
              </div>  
            </div> \
            <div  class="container m-3"> \
              <div class="row m-0 p-0">
                <div class="col-6 m-0 p-0 pr-2">
                  <input  class="form-control" type="text" placeholder="Login user name"  v-model:value="username"> \
                </div>
                <div class="col-6 m-0 p-0">
                  <input  class="form-control" type="password" placeholder="Login Password"  v-model:value="password"> \
                </div>
              </div>  
            </div> \ 
            <div  class="container m-3"> \
              <div class="row m-0 p-0">
                <div class="col-6 m-0 p-0 pr-2">
                  <input  class="form-control" type="text" placeholder="CPU Limit (200m)"  v-model:value="cpulimit"> \
                </div>
                <div class="col-6 m-0 p-0">
                  <input  class="form-control" type="text" placeholder="Memory Limit (300Mi)"  v-model:value="memorylimit"> \
                </div>
              </div>  
            </div> \ 
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="setupGrafana()" 
                :disabled="!(nscontext && username && password )">Submit</button> \
            </div>  
            <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5> 
        </div>`,
    },
);
