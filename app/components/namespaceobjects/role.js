/* eslint-disable max-len */
export default
Vue.component('role',
    {
      data: function() {
        return {
          role: '',
          clusterselector: '',
          namespaceselector: '',
          apigroups: '',
          resources: '',
          rules: [],
          repoName: '',
          permissionarray: [],
        };
      },
      props: ['nscontext'],
      methods: {
        addNewRule: function() {
          const newRule = {};
          this.apigroups = this.apigroups == '' ? this.apigroups : ',' + this.apigroups;
          newRule['apigroups'] = this.apigroups.split(',');
          newRule['resources'] = this.resources.split(',');
          newRule['permissionarray'] = this.permissionarray;

          this.rules.splice(0, 0, newRule);
          this.apigroups = '';
          this.resources = '';
          this.permissionarray = [];
        },
        createRole() {
          const vueObj = this;
          this.repoName = globalobj.selected;
          const formData = new FormData();
          formData.append('nscontext', vueObj.nscontext);
          formData.append('rules', JSON.stringify(vueObj.rules));
          Object.keys(this.$data).forEach( (key) => {
            if (key != 'rules')
            formData.append(key, this.$data[key])
          });
          axios.post('/createRole',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.appendLog(resp.data);
            vueObj.refreshClusterTree();
            vueObj.role = '';
            vueObj.rules = [];
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
              <input  class="form-control" type="text" placeholder="Cluster Selector" v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3"> \
              <input  class="form-control" type="text" placeholder="Namespace Selector" v-model:value="namespaceselector"> \
            </div> \
            <h5><span class="badge badge-default">Role Definition:</span></h5>
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Role Name" v-model:value="role"> \
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
                <button type="button" class="btn btn-dark" :disabled="!(nscontext && role && rules.length > 0)" v-on:click="createRole()">Submit</button> \
            </div>  
            <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5> 
        </div>`,
    },
);
