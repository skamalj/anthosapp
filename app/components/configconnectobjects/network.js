/* eslint-disable max-len */
// This component gets reponame from global object "globalobj" which is being created in
// main.handlebars in views directory
export default
Vue.component('Network',
    {
      data: function() {
        return {
          networkname: '',
          description: '',
          routingmode: 'REGIONAL',
          autocreatesubnetworks: '',
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
        createNetwork() {
          const vueObj = this;
          // Set reponame from global vue object and send to bankend post request
          this.repoName = globalobj.selected;
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/createNetwork',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.appendLog(resp.data);
            refreshAnthosTree();
            vueObj.networkname =  '';
            vueObj.description = '';
            vueObj.routingmode = '';
            vueObj.autocreatesubnetworks = '';
            vueObj.labelrows = [];
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        // This code uses ref object to find a parent and call refresh on that directory tree
        refreshAnthosTree() {
          this.$parent.$refs.configconnecttree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Network Name" v-model:value="networkname"> \
            </div> \ 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Description" v-model:value="description"> \
            </div> \
            <div class="container m-3">
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="routingmode" v-model="routingmode" id="regionalMode" value="REGIONAL">
                <label class="form-check-label" for="regionalMode">Regional</label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="routingmode" v-model="routingmode" id="globalMode" value="GLOBAL">
                <label class="form-check-label" for="globalMode">Global</label>
              </div>
            </div> 
            <div class="container m-3">
              <div class="form-check">
                  <input class="form-check-input" type="checkbox" v-model="autocreatesubnetworks" id="autocreatesubnetworksCheck">
                  <label class="form-check-label" for="autocreatesubnetworksCheck">
                      Auto Create SubNetworks
                  </label>
              </div>
            </div>  
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
                <button type="button" :disabled="!networkname || (labelrows.length == 0)" class="btn btn-dark" v-on:click="createNetwork()">Submit</button> \
            </div>  
        </div>`,
    },
);
