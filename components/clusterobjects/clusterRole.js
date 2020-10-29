/* eslint-disable max-len */
export default
Vue.component('clusterRole',
    {
      data: function() {
        return {
          clusterrole: '',
          clusterselector: '',
          apigroups: '',
          resources: '',
          rules: [],
          repoName: '',
          permissionarray: [],
        };
      },
      methods: {
        addNewRule: function() {
          const newRule = {};
          newRule['apigroups'] = this.apigroups.split(',');
          newRule['resources'] = this.resources.split(',');
          newRule['permissionarray'] = this.permissionarray;

          this.rules.splice(0, 0, newRule);
          this.apigroups = '';
          this.resources = '';
          this.permissionarray = [];
        },
        createClusterRole() {
          const vueObj = this;
          this.repoName = globalobj.selected;
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/createClusterRole',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.log = globalobj.log + '\n' + resp.data;
            vueObj.refreshClusterTree();
            vueObj.clusterrole = '';
            vueObj.rules = [];
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshClusterTree() {
          this.$parent.$refs.clusterdirtree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <div  class="container m-3"> \
              <input  class="form-control" type="text" placeholder="Cluster Selector" v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Clusterrole Name" v-model:value="clusterrole"> \
            </div> \ 
            <div  class="row  d-flex m-3 p-0"> \
                <div class="col-5">
                  <input  class="form-control" type="text" placeholder="API Groups" v-model="apigroups"> \
                </div>
                <div class="col-6">
                  <input  class="form-control" type="text" placeholder="Resource List (Comma separated)"  v-model="resources"> \
                </div>
                <div class="col-1 m-0 p-0" v-if="resources" v-on:click="addNewRule">  
                  <button type="button m-0 p-0" class="btn btn-light" >
                    <i class="fa fa-plus" aria-hidden="true"></i>
                  </button>
                </div> 
            </div>
            <div  class="container m-3">
            <h5><span class="badge badge-default">Permissions: 
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" value="get" v-model="permissionarray">
              <label class="form-check-label" for="inlineCheckbox1">Get</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" value="list" v-model="permissionarray">
              <label class="form-check-label" for="inlineCheckbox2">List</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" value="watch" v-model="permissionarray">
              <label class="form-check-label" for="inlineCheckbox3">watch</label>
            </div>  
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" value="create" v-model="permissionarray">
              <label class="form-check-label" for="inlineCheckbox1">Create</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" value="update" v-model="permissionarray">
              <label class="form-check-label" for="inlineCheckbox2">Update</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" value="patch" v-model="permissionarray">
              <label class="form-check-label" for="inlineCheckbox3">Patch</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" value="delete" v-model="permissionarray">
              <label class="form-check-label" for="inlineCheckbox3">Delete</label>
            </div>
            </span></h5>
            </div>
            <template v-for="(rule,index) in rules">
              <div  class="row  d-flex m-3 p-0"> \
                <div class="col-11">
                  <table class="table table-sm table-dark">
                    <thead>
                      <tr>
                        <th scope="col">Rule-{{ index }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">apiGroups</th>
                        <td>{{ rule.apigroups }}</td>
                      </tr>
                      <tr>
                        <th scope="row">resources</th>
                        <td>{{ rule.resources }}</td>
                      </tr>
                      <tr>
                        <th scope="row">verbs</th>
                        <td>{{ rule.permissionarray }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div> 
                <div class="col-1 m-0 p-0">  
                  <button type="button m-0 p-0" class="btn btn-light" v-on:click="rules.splice(index,1)">
                    <i class="fa fa-minus" aria-hidden="true"></i>
                  </button>
                </div>           
              </div> \
            </template>  
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-if="clusterrole && rules.length > 0" v-on:click="createClusterRole()">Submit</button> \
            </div>  
        </div>`,
    },
);
