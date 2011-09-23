var etv = {}; etv.vid = {}; etv.vid.bmark = {}
// - - -- - - -- - - -- - - -- - - - -- - - - - -- - - -- - - - -- - - 
//----------------------  MODELS  --------------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -

// Folder Item 
etv.vid.bmark.Entry = Backbone.Model.extend({
	urlRoot: '/api/v3.0/media/lists/',

  url: function(){
    return this.urlRoot+this.get('playlist').id+'/entries/'+this.get('id')+'/'
  }

  });



// Folder model
etv.vid.bmark.Folder = Backbone.Model.extend({

    initialize: function() {
      this.children = new etv.vid.bmark.Entries([],{parent_model:this});
    },

    url: function(){
      return '/api/v3.0/media/lists/'+this.get('id')+'/'
    }
    
});


// Empty model for AppView
etv.vid.bmark.AppModel = Backbone.Model.extend({})







// - - - - - - - - - - - - - - -- - - - -- - - - - -- - - -- - - - -- -
//----------------------  COLLECTIONS  --------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -

// Items Collection
etv.vid.bmark.Entries = Backbone.Collection.extend({

  initialize: function(list,options) {
      this.parent_model = options.parent_model;
    },

  model: etv.vid.bmark.Entry,

  // to change
  url: function(){
    return '/api/v3.0/media/lists/'+this.parent_model.get('id')+'/entries/'
  },

});



//  Folder Collection
etv.vid.bmark.Folders = Backbone.Collection.extend({

	model: etv.vid.bmark.Folder,

	url: '/api/v3.0/media/lists?ptype=1',

});






// - - -- - - -- - - -- - - -- - - - -- - - - - -- - - -- - - - -- - - 
//----------------------  VIEWS  --------------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -


//Base View class with common methods to extend in future views 
etv.vid.bmark.BaseView = Backbone.View.extend({

   childrenClassName: 'child_container',

   initialize: function(attrs, options){
        this.children_views = []
        this.el = $(this.el)
        this.children_container = $(this.make("div", {className: this.childrenClassName}))
        this.children = new this.collection_class([],{'parent_model':this.model})
        this.children.bind('reset', this.addAll, this);
        this.children.bind('add', this.addOne, this);
        this.model.bind('destroy', this.remove, this);
   },

   addOne: function(model){
      var children_view = new this.childrens_view({model: model, parent_view:this})
      this.children_views.push(children_view)
      $(this.children_container).prepend(children_view.render().el)
    },

   addAll: function(){
      this.children.each(this.addOne, this)
      this.el.append(this.children_container)
    },


  //this method uses only perent 
  render: function(){
      $(this.el).html(this.template(this.model.toJSON()))
      return this
    }

});


// Single Entry view
etv.vid.bmark.EntryView = etv.vid.bmark.BaseView.extend({

    tagName: "div",

    className: "etv-app-items",

    template: _.template(this.$('#item_template').html()),

    events: {
          'click #.item_remove': 'removeItem',
        },

    initialize: function(){
         this.el = $(this.el)
         etv.vid.bmark.Entries.bind('reset', this.addAll, this);
         this.model.bind('remove', this.remove, this)
     },

     removeItem: function(){
       this.model.destroy();
       this.el.hide('slow', function(){this.remove})
     }
});




//Single folder view
etv.vid.bmark.FolderView = etv.vid.bmark.BaseView.extend({

  edit_mod: false,

  opend: false,

  childrenClassName: 'children_container',

  collection_class: etv.vid.bmark.Entries,

  childrens_view: etv.vid.bmark.EntryView,
 
  tagName: "div",

  className: "etv-app-folder",

  template: _.template(this.$('#folder_template').html()),

  events: {
      "click #.open": "folderToggle",
      "click #.folder_remove": "removeFolder",
      "click .save_edit" : 'toggleEditMod'
    },


   initialize: function(attributes,options){
        etv.vid.bmark.BaseView.prototype.initialize.call(this, attributes, options);
        this.children_container.css({height:'0px;'})
    },


   toggleEditMod: function(e){
      e.preventDefault()
      if (!this.edit_mod) { this.turn_edit_mod()  } 
      else { this.turn_of_edit_mod() }
   },

   turn_edit_mod: function() {
     console.log('edit_mod')
     this.edit_mod = true;
     var val = this.el.find('.tit').text()
     this.el.find('.tit').html('<input class="input_edit" value="'+val+'" type="text" ></input>')
   },

   turn_of_edit_mod: function() {
    this.edit_mod = false
     var val = this.el.find('.input_edit').val()
     this.el.find('.tit').html(val)
   },



  folderToggle: function(){
    if (!this.opend) {
        this.children.fetch({success: this.openFolder() })
      }
    else {
      this.closeFolder()
    }
  },

  openFolder : function(){
    this.options.parent_view.closeAllChildren()
    this.el.find('.open').html('CLOSE')
    this.opend = true
    this.el.attr({'open':true})
    this.children_container.slideDown(1000)
  },

  closeFolder: function(){
    this.children_container.slideUp(1000)
    this.el.find('.open').html('OPEN')
    this.opend = false
    this.children_container.html('')
    this.el.attr({'open':false})
  },

  removeFolder: function(){
    this.model.destroy();
    this.el.hide('fast', function(){this.remove})
  },

  render: function(){
    if (this.model.get('shared')) {
         this.model.set({ privat: true, shared: false})
     } else {
       this.model.set({ privat: false, shared: true})
     };

    $(this.el).html(this.template(this.model.toJSON()))


    self = this
    this.el.find('input').change(function(){
          var val = $(this).attr('value')
          self.sharedChanged(val)
        })
    return this
  },

  sharedChanged: function(val){
    this.model.set({'shared':val})
    this.model.save()
  }

});


// Bookmarks Main Viev 
etv.vid.bmark.BookmarksView = etv.vid.bmark.BaseView.extend({

  collection_class : etv.vid.bmark.Folders,

  childrens_view: etv.vid.bmark.FolderView,

  events: {
    "click #createNew": "emptyForm",
  },

  initialize: function(attributes,options){
        this.model = new etv.vid.bmark.AppModel
        etv.vid.bmark.BaseView.prototype.initialize.call(this, attributes, options);
        this.children.fetch()
    },
  
  closeAllChildren: function(){
    _.map(this.children_views, (function(view){ if (view.opend) {view.closeFolder()};  } ) )
  },


  emptyForm: function(){

   var model = new etv.vid.bmark.Entry({ 'title':'', 'description':'', 'duration':'0', 'items':'0'});

   var child_view =  new this.childrens_view({model:model});

   this.children.add(model,{at:0})

   this.children_views.push(child_view);

   child_view.turn_edit_mod();
  }

});














// - - -- - - -- - - -- - - -- - - - -- - - - - -- - - -- - - - -- - - 
//----------------------  DOC  --------------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -



// /api/v3.0/media/lists?ptype=1
// [
   // {
   //     "updated": "2011-09-13 13:41:23",
   //     "description": "",
   //     "created": "2011-09-13 13:41:23",
   //     "items": 1,
   //     "title": "Test",
   //     "ptype": 1,
   //     "user": {
   //         "username": "api"
   //     },
   //     "duration": 0,
   //     "shared": false,
   //     "id": 1
   // },
//    {
//        "updated": "2011-09-13 13:41:23",
//        "description": "",
//        "created": "2011-09-13 13:41:23",
//        "items": 0,
//        "title": "Test1",
//        "ptype": 1,
//        "user": {
//            "username": "api"
//        },
//        "duration": 0,
//        "shared": false,
//        "id": 2
//    }
// ]

// /api/v3.0/media/lists/1
// {
//    "updated": "2011-09-13 13:42:34",
//    "description": "",
//    "created": "2011-09-13 13:42:34",
//    "items": 1,
//    "title": "Test",
//    "ptype": 1,
//    "user": {
//        "username": "api"
//    },
//    "duration": 0,
//    "shared": false,
//    "id": 1
// }
// 1:45 PM
// /api/v3.0/media/lists/1/entries
// [
//    {
//        "media": {
//            "name": "Interny",
//            "description_full": null
//        },
//        "playlist": {
//            "updated": "2011-09-13 13:45:34",
//            "description": "",
//            "created": "2011-09-13 13:45:34",
//            "items": 2,
//            "title": "Test",
//            "ptype": 1,
//            "user": {
//                "username": "api"
//            },
//            "duration": 0,
//            "shared": false,
//            "id": 1
//        },
//        "added": "2011-09-13 13:45:34",
//        "order": 0
//    },
//    {
//        "media": {
//            "name": "Interny2",
//            "description_full": null
//        },
//        "playlist": {
//            "updated": "2011-09-13 13:45:34",
//            "description": "",
//            "created": "2011-09-13 13:45:34",
//            "items": 2,
//            "title": "Test",
//            "ptype": 1,
//            "user": {
//                "username": "api"
//            },
//            "duration": 0,
//            "shared": false,
//            "id": 1
//        },
//        "added": "2011-09-13 13:45:34",
//        "order": 1
//    }
// ]

