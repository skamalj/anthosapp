/* eslint-disable max-len */
export default
Vue.component('dirtree',
    {
      props: {treeNode: null, currentNode: null, hidenamespace: null, repoName: null},
      data: function() {
        return {
          parentNode: 'root',
          folderToggle: '',
          treeClass: 'container m-0 p-0 collapse show',
          files: [{name: 'head', type: 'file', path: 'test'}],
          filecontent: 'Loading...',
        };
      },
      computed: {
        folderClass: function() {
          return 'fa fa-folder';
        },
      },
      methods: {
        async getRepoTree() {
          const vueObj = this;
          const formData = new FormData();
          formData.append('repoName', vueObj.repoName);
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          formData.append('hidenamespace', vueObj.hidenamespace);
          return await axios.post('/getRepoTree',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(res) {
            vueObj.$set(vueObj.files, 0, res.data);
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        async refresh() {
          if (this.parentNode != 'root') {
            this.$parent.refresh();
          } else {
            this.files = [];
            this.getRepoTree();
          }
        },
        async deletefile(fname) {
          const vueObj = this;
          return await axios.post('/deleteFile', {filename: fname})
              .then(function(res) {
                vueObj.refresh();
                globalobj.appendLog(res.data);
              })
              .catch((err) => {
                window.alert(err);
              });
        },
        contextevent(nscontext) {
          this.$emit('nscontext', nscontext);
        },
        filecontentevent(fpath) {
          this.$emit('filecontentevent', fpath);
        },
      },
      watch: {
        repoName: function(val) {
          this.refresh();
        },
      },
      async created() {
        if (this.currentNode) {
          this.parentNode = this.currentNode;
          if (this.parentNode != 'head') {
            this.treeClass = 'container m-0 p-0 collapse';
          }
        }
        if (this.treeNode) {
          this.files = this.treeNode;
        }
        if (this.parentNode == 'root') {
          await this.getRepoTree();
        }
      },
      template: ` \
        <div :class="treeClass" :id="parentNode"> 
          <ul class="list-group">
            <div v-for="f in files">
              <template v-if="f.type === 'file'">
                <li class="list-group-item list-group-item py-0 border-0" :key="f.name">
                  <i class="fa fa-file" aria-hidden="true"></i>
                  <span v-on:click="filecontentevent(f.path)"><small>{{ f.name }}</small></span>
                  <button type="button m-0 p-0" class="btn btn-sm btn-light" v-on:click="deletefile(f.path)">
                  <i class="fas fa-minus-circle" aria-hidden="true"></i>
                  </button>
                </li>  
              </template>
              <template v-if="f.type === 'folder'">
                <div class="row m-0 p-0">
                  <li class="list-group-item py-0 border-0"  data-toggle="collapse" :data-target="'#'+f.name" :key="f.name">
                    <i :class="folderClass" aria-hidden="true"></i>
                    {{ f.name }}
                  </li> 
                  <button type="button m-0 p-0" class="btn btn-sm btn-light" v-on:click="contextevent(f.path)">
                  <i class="fas fa-arrow-alt-circle-right" style="color: Dodgerblue;" aria-hidden="true"></i>
                  </button> 
                  <button type="button m-0 p-0" v-if="f.name === 'head'" class="btn btn-sm btn-light" v-on:click="refresh()">
                  <i class="fa fa-sync-alt" style="color: Dodgerblue;" aria-hidden="true"></i>
                  </button>
                </div>
                <li class="list-group-item list-group-item py-0 border-0">
                  <dirtree v-bind:treeNode="f.tree.files" :currentNode="f.name" v-on="$listeners"></dirtree>
                </li>  
              </template>
            </div>    
          </ul>
        </div>`,
    },
);
