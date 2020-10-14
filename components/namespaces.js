/* eslint-disable max-len */
export default
Vue.component('NameSpaces',
    {
      props: {treeNode: null, currentNode: null, hidenamespace: null},
      data: function() {
        return {
          repoName: 'test',
          parentNode: 'root',
          folderToggle: '',
          treeClass: 'container m-0 p-0 collapse show',
          tree: {files: []},
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
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          formData.append('hidenamespace', vueObj.hidenamespace);
          await axios.post('/getRepoTree',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(res) {
            // vueObj.tree = {files: [res.data]};
            Vue.set(vueObj.tree, 'files', [res.data]);
          })
              .catch(function(err) {
                window.alert(err);
                return null;
              });
        },
        refresh() {
          this.tree = {};
          this.getRepoTree();
        },
      },
      async created() {
        if (this.currentNode) {
          this.parentNode = this.currentNode;
          this.treeClass = 'container m-0 p-0 collapse';
        }
        if (this.treeNode) {
          this.tree = this.treeNode;
        }
        if (this.parentNode == 'root') {
          await this.getRepoTree();
        }
      },
      template: ` \
        <div :class="treeClass" :id="parentNode"> 
          <ul class="list-group">
            <div v-for="f in tree.files">
              <template v-if="f.type === 'file'">
                <li class="list-group-item list-group-item py-0 border-0" :key="f.name">
                  <i class="fa fa-file" aria-hidden="true"></i>
                  {{ f.name }}
                </li>  
              </template>
              <template v-if="f.type === 'folder'">
                <li class="list-group-item py-0 border-0"  data-toggle="collapse" :data-target="'#'+f.name" :key="f.name">
                  <i :class="folderClass" aria-hidden="true"></i>
                  {{ f.name }}
                </li>  
                <li class="list-group-item list-group-item py-0 border-0">
                  <NameSpaces v-bind:treeNode="f.tree" :currentNode="f.name"></NameSpaces>
                </li>  
              </template>
            </div>    
          </ul>
        </div>`,
    },
);
