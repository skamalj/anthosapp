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
          repoName: '',
          clusterselector: '',
          abstractnamespace: '',
        };
      },
      props: ['nscontext'],
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
          this.repoName = globalobj.selected;
          const formData = new FormData();
          formData.append('nscontext', JSON.stringify(vueObj.nscontext));
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/createNamespace',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function() {
            window.alert('SUCCESS!!');
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
        refreshClusterTree() {
          this.$parent.$refs.namespacetree.refresh();
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
        </div>`,
    },
);
