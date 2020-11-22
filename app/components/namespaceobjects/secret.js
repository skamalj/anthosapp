/* eslint-disable max-len */
export default
Vue.component('Secret',
    {
      data: function() {
        return {
          clusterselector: '',
          namespaceselector: '',
          secretname: '',
          secrettype: 'dockerConfig',
          configjson: null,
          crtfile: null,
          keyfile: null,
          datarows: [],
          newdatakey: '',
          newdataval: '',
        };
      },
      computed: {
        configjsonPrompt: function() {
          return this.configjson == null ? 'Upload docker config.json' : this.configjson.name;
        },
        crtfilePrompt: function() {
          return this.crtfile == null ? 'Upload certificate (PEM format)' : this.crtfile.name;
        },
        keyfilePrompt: function() {
          return this.keyfile == null ? 'Upload key file (PEM format)' : this.keyfile.name;
        }
      },
      props: ['nscontext'],
      methods: {
        handleFileUpload(fileref) {
            this[fileref] = this.$refs[fileref].files[0];  
        },
        addNewSecretData: function() {
          const newdata = {};
          newdata[this.newdatakey] = this.newdataval;
          this.datarows.splice(0, 0, newdata);
          this.newdatakey = '';
          this.newdataval = '';
        },
        createSecret() {
          const formData = new FormData();
          formData.append('nscontext', this.nscontext);
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          formData.set('datarows', JSON.stringify(this.$data.datarows));
          axios.post('/createSecret',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.appendLog(resp.data);
          })
              .catch(function(err) {
                window.alert(err);
              });
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
          <h5><span class="badge badge-default">Secret Definition:</span></h5>   
          <div  class="container m-3"> \
              <input  class="form-control" type="text" placeholder="Secret Name"  v-model:value="secretname"> \
          </div> \
          <div class="row m-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="secrettype" v-model="secrettype" id="dockerConfig" value="dockerConfig">
              <label class="form-check-label" for="dockerConfig">Docker Config</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="secrettype" v-model="secrettype" id="tls" value="tls">
              <label class="form-check-label" for="tls">TLS</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="secrettype" v-model="secrettype" id="generic" value="generic">
              <label class="form-check-label" for="generic">Generic</label>
            </div>
          </div>  
          <div class="row m-3 custom-file" v-if="secrettype == 'dockerConfig'">
            <input type="file" class="custom-file-input" id="configjson" ref="configjson" v-on:change="handleFileUpload('configjson')">
            <label class="custom-file-label" for="configjson">{{ configjsonPrompt }}</label>
            <div class="container">
            </div>
          </div>

          <div v-if="secrettype == 'tls'">
            <div class="row m-3 custom-file">
              <input type="file" class="custom-file-input" id="crtfile" ref="crtfile" v-on:change="handleFileUpload('crtfile')">
              <label class="custom-file-label" for="crtfile">{{ crtfilePrompt }}</label>
              <div class="container">
              </div>
            </div>
            <div class="row m-3 custom-file">
              <input type="file" class="custom-file-input" id="keyfile" ref="keyfile" v-on:change="handleFileUpload('keyfile')">
              <label class="custom-file-label" for="keyfile">{{ keyfilePrompt }}</label>
              <div class="container">
              </div>
            </div>
          </div>  

          <div  v-if="secrettype == 'generic'" class="row  d-flex m-3 p-0"> \
            <div class="col-5">
              <input  class="form-control" type="text" placeholder="Data Key" v-model="newdatakey"> \
            </div>
            <div class="col-5">
              <input  class="form-control" type="text" placeholder="Data  Value"  v-model="newdataval"> \
            </div>
            <div class="col-1 m-0 p-0" v-if="newdatakey && newdataval" 
              v-on:click="addNewSecretData">  
              <button type="button m-0 p-0" class="btn btn-light" >
                <i class="fa fa-plus" aria-hidden="true"></i>
              </button>
            </div>     
            <template  v-for="(data, index) in datarows">
                <div class="col-5 mt-2">
                  <input  class="form-control" type="text" readonly v-model:value="(Object.keys(data))[0]"> \
                </div>
                <div class="col-5 mt-2">
                  <input  class="form-control" type="text" readonly v-model:value="data[(Object.keys(data))[0]]"> \
                </div> 
                <div class="col-1 mt-2 p-0">  
                  <button type="button m-0 p-0" class="btn btn-light" v-on:click="datarows.splice(index,1)">
                    <i class="fa fa-minus" aria-hidden="true"></i>
                  </button>
                </div>           
            </template> 
            </div>
            
          <div class="row mb-5 justify-content-end"> \
              <button type="button" class="btn btn-dark" :disabled="!((
                (configjson && secrettype == 'dockerConfig')
                || (crtfile && keyfile && secrettype == 'tls') 
                || (datarows.length != 0 && secrettype == 'generic')) 
                && nscontext && secretname)" 
                v-on:click="createSecret()">Create</button> \
          </div>
          <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5>
        </div>`,
    },
);
