/* eslint-disable max-len */
export default
Vue.component('Selector',
    {
      data: function() {
        return {
          selectortype: '',
          selectorname: '',
          newlabelkey: '',
          newlabelval: '',
          labelrows: [],
          repoName: '',
        };
      },
      methods: {
        addNewLabel: function() {
          const newlabel = {};
          newlabel[this.newlabelkey] = this.newlabelval;
          this.labelrows.splice(0, 0, newlabel);
          this.newlabelkey = '';
          this.newlabelval = '';
        },
        createSelector() {
          vueObj = this;
          this.repoName = globalobj.selected;
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/createSelector',
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
            <div  class="container m-3">
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="selectorType" id="clusterselector" v-model="selectortype" value="ClusterSelector">
                <label class="form-check-label" for="clusterselector">Cluster Selector</label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="selectorType" id="namespaceselector" v-model="selectortype" value="NamespaceSelector">
                <label class="form-check-label" for="namespaceselector">Namespace Selector</label>
              </div>
            </div>
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Selector Name" v-model:value="selectorname"> \
            </div> \ 
            <div  class="row  d-flex m-3 p-0"> \
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
                <button type="button" :disabled="!selectortype || !selectorname || (labelrows.length == 0)" class="btn btn-dark" v-on:click="createSelector()">Submit</button> \
            </div>  
        </div>`,
    },
);
