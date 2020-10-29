/* eslint-disable max-len */
export default
Vue.component('namespace',
    {
      data: function() {
        return {
          namespace: '',
          newlabelkey: '',
          newlabelval: '',
          labelrows: [],
          clusterselector: '',
          abstractnamespace: '',
          emptyabstractns: [],
        };
      },
      props: ['nscontext', 'repoName'],
      watch: {
        repoName: function(val) {
          this.listEmptyNS();
        },
      },
      created() {
        this.listEmptyNS();
      },
      methods: {
        addNewLabel: function() {
          const newlabel = {};
          newlabel[this.newlabelkey] = this.newlabelval;
          this.labelrows.splice(0, 0, newlabel);
          this.newlabelkey = '';
          this.newlabelval = '';
        },
        createNamespace() {
          const vueObj = this;
          const formData = new FormData();
          formData.append('nscontext', JSON.stringify(vueObj.nscontext));
          formData.append('repoName', JSON.stringify(vueObj.repoName));
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/createNamespace',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(response) {
            globalobj.log = response.data;
            vueObj.refreshClusterTree();
            vueObj.namespace = '';
            vueObj.labelrows = [];
            vueObj.abstractnamespace = '';
            vueObj.clusterselector = '';
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        listEmptyNS() {
          const vueObj = this;
          const formData = new FormData();
          formData.append('repoName', JSON.stringify(vueObj.repoName));
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/listEmptyNS',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then((result) => {
            vueObj.emptyabstractns = result.data;
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        deleteDir(dirpath) {
          const vueObj = this;
          const formData = new FormData();
          formData.append('dirname', dirpath);
          axios.post('/deleteDir',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then((result) => {
            globalobj.log = result.data;
            vueObj.refreshClusterTree();
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshClusterTree() {
          this.$parent.$refs.namespacetree.refresh();
          this.listEmptyNS();
        },
      },
      template: ` \
        <div class="container"> \
            <div class="form-check m-3">
                <input class="form-check-input" type="checkbox" v-model="abstractnamespace" id="abstractNamespaceCheck">
                <label class="form-check-label" for="abstractNamespaceCheck">
                    Abstract Namespace
                </label>
            </div>
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Namespace Name"  v-model:value="namespace"> \
            </div> \ 
            <div  v-if="!abstractnamespace" class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector" v-model:value="clusterselector"> \
            </div> \
            <div  v-if="!abstractnamespace" class="row  d-flex m-3 p-0"> \
                <div class="col-5">
                  <input  class="form-control" type="text" placeholder="Label Key" v-model="newlabelkey"> \
                </div>
                <div class="col-5">
                  <input  class="form-control" type="text" placeholder="Label  Value"  v-model="newlabelval"> \
                </div>
                <div class="col-1 m-0 p-0" v-if="newlabelkey && newlabelval" 
                  v-on:click="addNewLabel">  
                  <button type="button m-0 p-0" class="btn btn-light" >
                    <i class="fa fa-plus" aria-hidden="true"></i>
                  </button>
                </div> 
            </div>    
            <template v-for="(label, index) in labelrows">
              <div  class="row  d-flex m-3 p-0"> \
                <div class="col-5">
                  <input  class="form-control" type="text" readonly v-model:value="(Object.keys(label))[0]"> \
                </div>
                <div class="col-5">
                  <input  class="form-control" type="text" readonly v-model:value="label[(Object.keys(label))[0]]"> \
                </div> 
                <div class="col-1 m-0 p-0">  
                  <button type="button m-0 p-0" class="btn btn-light" v-on:click="labelrows.splice(index,1)">
                    <i class="fa fa-minus" aria-hidden="true"></i>
                  </button>
                </div>           
              </div> \
            </template>  
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="createNamespace()" 
                :disabled="!(nscontext && namespace)">Submit</button> \
            </div>  
            <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5>
            <div class="container m-0 mt-5">  
            <table class="table">
            <caption style="caption-side:top">List of empty namespaces
            <button type="button m-0 p-0" class="btn btn-sm btn-light" v-on:click="listEmptyNS()">
            <i class="fa fa-sync-alt" style="color: Dodgerblue;" aria-hidden="true"></i>
            </button
            </caption>
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">Name</th>
                  <th scope="col">Path</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ns, index) in emptyabstractns">
                  <td>
                    <button type="button m-0 p-0" class="btn btn-sm btn-light" v-on:click="deleteDir(ns.nspath)">
                      <i class="fas fa-minus-circle" aria-hidden="true"></i>
                    </button>
                  </td>
                  <td>{{ ns.name }}</td>
                  <td>{{ ns.nspath }}</td>
                </tr>
              </tbody>
            </table>
            </div>  
        </div>`,
    },
);
