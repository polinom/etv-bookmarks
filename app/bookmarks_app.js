etv.utils = {};
etv.utils.slice = function(text,p){ if(text.length>=p){return text.slice(0,p)+"..."} else {return text} };
etv.utils.error_message = function(message){jAlert("<h3 style='color:red;'>"+message+"</h3>", {title:"tiletile"})};
etv.utils.info_message = function(message){jAlert("<h3 style='color:blue;'>"+message+"</h3>", {title:"tiletile"})};
etv.utils.dialog_message = function(question, callback){ jConfirm("<h3 style='color:blue;'>"+question+"</h3>", 'Подтвердите Действие!', callback) }


//------------------ BACKBONE SYNC -----------------------------------

// var original_sync = Backbone.sync

// Backbone.sync = function () {
//   console.log('sync started')
//   console.log(arguments)


//   arguments[2].success = function(){
//     console.log('sync finished')
//   }

//   original_sync.apply(Backbone, arguments);
// };



//---------------------------------------------------------------------
//----------------------  MODELS  -------------------------------------
//---------------------------------------------------------------------

etv.vid.bmark.Rubric = Backbone.Model.extend({
  urlRoot: '/api/v3.0/media/lists/rubrics/',
})



// Folder Item 
etv.vid.bmark.Entry = Backbone.Model.extend({
	urlRoot: '/api/v3.0/media/lists/',

  url: function(){
    return this.urlRoot+this.get('playlist').id+'/entries/'+this.get('id')+'/'
  },

  media_url: function(){
    return '/watch/'+this.get('media').id+'/'
  }

  });


// Folder model
etv.vid.bmark.Folder = Backbone.Model.extend({

    defaults: { 
     'image_path':'http://aux.iconpedia.net/uploads/196917932.png',
     'title':'Default Folder Name', 
     'description':'Default Folder Description',
      'duration':0,
      'items':0,
      'shared':0,
      "mark_total": 0,
      "mark_count": 0,
      'id':null,
      'rubric_verbose':'Нет Рубрики',
    },

    initialize: function(attrs, options) {
      this.children = new etv.vid.bmark.Entries([],{parent_model:this});
      Backbone.Model.prototype.initialize.call(this, attrs, options);
    },

    url: function(){
      if (this.get('id') == undefined) {
        return '/api/v3.0/media/lists/' 
      }
      else {
        return '/api/v3.0/media/lists/'+this.get('id')+'/'
      }
    },

    validate: function(attrs) {
    if (typeof attrs.description == 'string' && attrs.description.length === 0) {
           if(attrs.description.length <= 1) return "Напишите описания к папке!";
       }

    if (typeof attrs.title == 'string' && attrs.title.length === 0) {
          if(attrs.title.length <= 1) return "Назовите папку!";
       }

    },


    set: function(attrs, options){
      if (attrs['description']){
          this.set( {'desc_short': etv.utils.slice( attrs['description'], 300 )} )
      }
      if (attrs['title']){
          this.set( { 'title_short': etv.utils.slice( attrs['title'], 20 )} )
      }
         return Backbone.Model.prototype.set.call(this, attrs, options);
    },
    
});


// Empty model for AppView
etv.vid.bmark.AppModel = Backbone.Model.extend({})





// - - - - - - - - - - - - - - -- - - - -- - - - - -- - - -- - - - -- -
//----------------------  COLLECTIONS  --------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -

etv.vid.bmark.FolderRubric = Backbone.Collection.extend({
    model: etv.vid.bmark.Rubric,
    url: '/api/v3.0/media/lists/rubrics/'
})


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

  empty: function(){
    $.ajax({ type: "DELETE", url: this.url() })
  }

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
        _.bindAll(this, 'starsCallback', 'resortOnServer')
        this.children_views = []
        this.el = $(this.el)
        this.children_container = $(this.make("div", {'class': this.childrenClassName}))
        this.children = new this.collection_class([],{'parent_model':this.model})
        this.children.bind('reset', this.addAll, this);
        this.children.bind('add', this.addOne, this);
        this.model.bind('destroy', this.remove, this);
   },


   addOne: function(model){
      var self = this
      var children_view = new this.childrens_view({model: model, parent_view:this})
      this.children_views.push(children_view)
      $(this.children_container).prepend(children_view.render().el)
    },

   addAll: function(){
      var self = this
      this.children.each(this.addOne, this)
      this.el.find('.entries_container').append(this.children_container)
      etv.common.Fivestar.initialize(".fivestar",{ oneTimeOnly: true,
                                                   active: false,
                                                   success: function(res){
                                                          self.starsCallback(self, res)
                                                        }
                                                  })
    this.el.find('.scroll_fave').sortable({ handle: '.arrows', update: this.resortOnServer  })

    },

    resortOnServer: function(event, ui){
      var id = $(ui.item).attr('id')
      var index = $(ui.item).index() + 1
      model = this.children.get(id)
      model.set({'order':index})
      model.save()
    },

    starsCallback:function(self, res){
      self.model.set({mark_total: res.total, mark_count: res.count})
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

    className: "children_container_small",

    template: _.template(this.$('#item_template').html()),

    menu_template: _.template(this.$('#menu_template').html()),

    events: {
          'click .item_remove': 'removeItem',
          'click .folders': 'moveItemButton',
          'click .play_button': 'getMediaLink'
        },

    initialize: function(){
         _.bindAll(this, 'renderMenu','moveItem')
         this.el = $(this.el)
         etv.vid.bmark.Entries.bind('reset', this.addAll, this);
         this.model.bind('remove', this.remove, this)
         this.el.attr('id', this.model.get('id'))
     },


     getMediaLink: function(e){
      e.preventDefault()
      var self = this
      var data = {sl:'', bitrate:1}
      $.ajax({
            data: data,
            url: this.model.media_url(),
            type: "POST",
            dataType: 'json',
            success: function(resp){ self.playMedia(self,resp) }
        })
     },


     playMedia: function(self, resp){
      console.log(typeof etv.common.readCookie('Playinsilverlightcheckbox'))
       new etv.vid.play.Player({
        instanceUrl: 'http://static.etvnet.com/silverlight/OVP.xap',
        mediaUrl: resp.url,
        autoPlay: true,
        width: '540px',
        height: '481px',
        customParams : 'theme='+ 'http://static.etvnet.com/' + 'silverlight/themes/SmoothHD.xaml, stretchmode=Fit, stretchmodefullscreen=Fit, nologo=1',
        divId: 'SilverLight',
        errorMsg: "options.errorMsg"
      });
      
      if(etv.common.readCookie('Playinsilverlightcheckbox')==='true') {
          $('#SilverLight').dialog({position: ['center',100],  modal:true, width: '570px',title: this.model.get('media').name, beforeclose: function(event, ui) {$('#SilverLight').empty(); $('#SilverLight').dialog('destroy'); }});
      } else {
        location.href = resp.url
      }

     },

     removeItem: function(e){
       e.preventDefault();
       this.model.destroy();
       this.el.slideUp('slow', function(){this.remove})
       items = this.options.parent_view.model.get('items') - 1
       duration = this.options.parent_view.model.get('duration') - this.model.get('media').duration
       this.options.parent_view.model.set({'items': items, 'duration': duration })
       //this.options.parent_view.model.set({'duration': duration})
     },

     moveItemButton: function(e){
       e.preventDefault()
       if (!this.menu_opend){ this.openMenu() } 
       else { this.closeMenu() }
     },

     openMenu: function(){
      this.menu_opend = true
       this.renderMenu()
     },

     closeMenu: function(){
       this.menu_opend = false
       this.menu.remove()
     },

     renderMenu: function(e){
      var self = this
      var folders = this.options.parent_view.options.parent_view.children.toJSON()
      var html_folders = this.menu_template({'folders': folders})
      this.el.find('.folders').parent().append(html_folders);
      this.menu = this.el.find('.drop_fave')
      this.menu.find('.folder_add').live('click', function(e) { e.preventDefault(); self.moveItem(e,$(this));})
     },

     moveItem: function(e,link){
       var id = link.attr('id').replace('id_','')
       this.removeItem(e)
       var folder = this.options.parent_view.options.parent_view.children.get(parseInt(id))
       var items = folder.get('items') + 1
       var duration = folder.get('duration') + this.model.get('media').duration
       var image = this.model.get('image_path')
       folder.set( {items:items, duration:duration, image_path: image} )
       var url = folder.url()+'entries/'+this.model.get('media').id+'/'
       $.ajax({ data: {},
                 type: 'POST',
                 contentType: 'application/x-www-form-urlencoded',
                 url: url,
                 success: function(resp,status){console.log(resp)}
        })
     }
});

//Single folder view
etv.vid.bmark.FolderView = etv.vid.bmark.BaseView.extend({

  empty_folder_image_url: 'http://aux.iconpedia.net/uploads/196917932.png',

  slideSpeed: 'slow',

  edit_mod: false,

  opend: false,

  childrenClassName: 'scroll_fave',

  collection_class: etv.vid.bmark.Entries,

  childrens_view: etv.vid.bmark.EntryView,
 
  tagName: "div",

  className: "etv-app-folder",

  template: _.template(this.$('#folder_template').html()),

  events: {
      "click .open, .close, .poster_a": "folderToggle",
      "click .folder_remove": "removeFolder",
      "click .save_edit_title" : 'toggleEditModTitle',
      "click .save_edit_desc" : 'toggleEditModDesc',
      "click .empty" : 'emptyFolder', 
      "click .save_edit_rubric" : 'toggleEditModRubric',
    },

  confirm_shared_message: function() {
    var desc = this.model.get('description')
    if (desc.length === 3){
      desc = this.default_description()
    }
    return 'Папка «'+this.model.get('title')+'» с описанием «'+ desc +'» из раздела «'+this.model.get('rubric_verbose')+'» будет доступна другим зрителям eTVnet'
   },


  default_description: function() { 
    if (this.children.length === 0) this.children.fetch()
    var desc = "В данной папке собраны фильмы и передачи из следующих разделов: "
    this.children.each(function(item){
      console.log(item)
    })

    return desc
  },

  emptyFolder: function(e) {
    etv.utils.dialog_message("OPOPOPOPOP", function(r){console.log(r)});
    e.preventDefault()
    this.children.empty()
    this.closeFolder()
    this.model.set({'items':0,'duration':0})
  },

  initialize: function(attributes,options){
        etv.vid.bmark.BaseView.prototype.initialize.call(this, attributes, options);
        this.children_container.css({height:'0px;'})
        _.bindAll(this, 'sharedChanged', 'confirmSharedChanged', 'openFolder', 'closeFolder', 'showLoader', 'hideLoader')
        this.model.bind("error", this.handleValidationError)
        this.model.bind("change:shared", this.shared_changed, this)
        this.model.bind("change:title", this.titleChanged, this)
        this.model.bind("change:description", this.descChanged, this)
        this.model.bind("change:items", this.itemsChanged, this)
        this.model.bind("change:duration", this.durationChanged, this)
        this.model.bind("change:id", this.idChanged, this)
        this.model.bind("change:mark_count", this.mark_count_changed, this)
        this.model.bind("change:image_path", this.image_path_changed, this)
    },

  showLoader: function(){
    this.el.find('.app_loader').show()
  },

  hideLoader: function(){
    this.el.find('.app_loader').hide()
  },

  toggleEditModRubric: function(e){
    e.preventDefault()
    if (this.rubric_edit_mod) {
      this.rubricTurnOffEditMod()
    } else {
      this.rubricTurnEditMod()
    }
  },


  rubricTurnEditMod: function(){
    self = this
    var rubrics = this.options.parent_view.rubrics
    var select = this.make("select", {'className': "medium", 'name': "mediumSelect", 'id': "mediumSelect" }, "Bold! ")
    $(select).append(self.make("option",{'value':0}, 'Нет Рубрики' ) )
    rubrics.each(function(rubric){
      console.log(rubric.get('id'), self.model.get('rubric'))
         if (rubric.get('id') == self.model.get('rubric')){
             var option = self.make("option",{'value':rubric.get('id'), 'selected':'selected'}, rubric.get('name'))
          } else {
             var option = self.make("option",{'value':rubric.get('id')}, rubric.get('name'))
          }
        $(select).append(option)
    })
    this.el.find('.rubrika').html(select)
    this.rubric_edit_mod = true
  },

  rubricTurnOffEditMod: function(){
    this.rubric_edit_mod = false
    var select = this.el.find('.rubrika').find('select option:selected')
    var id = select.val()
    var text = select.text()
    this.model.set({'rubric':id, 'rubric_verbose':text})
    this.model.save()
    var t = this.make('span', {}, text)
    this.el.find('.rubrika').html(t)
  },

  image_path_changed: function(e){
    this.el.find('.favorite_folder_poster').find('img').attr('src', this.model.get('image_path'))
  },

  mark_count_changed: function(e){
    this.el.find(".mark_count").html(this.model.get('mark_count'))
  },

  shared_changed: function(e){
    if (this.model.get('shared')) {
        this.el.find('.stars_fave').fadeIn('fast') }
    else {
      this.el.find('.stars_fave').fadeOut('fast')
    }
  },

  idChanged: function(e){
    val = this.el.find('.fivestar').attr('action')
    this.el.find('.fivestar').attr('action', val.replace('//', '/'+this.model.get('id') +'/' ) )
    etv.common.Fivestar.initialize(".fivestar")
  },

  itemsChanged: function(e){
    items = this.model.get('items')
    this.el.find('.items_amout').html(items)
    if (items==0){
      this.el.find('.favorite_folder_poster').find('img').attr('src',this.empty_folder_image_url)
    }
  },

  durationChanged: function(e){
    this.el.find('.total_duration').html(this.model.get('duration'))
  },

  descChanged: function(e){
    this.el.find('.desc').find('span').html( this.model.get('desc_short'))
  },
  
  titleChanged: function(e){
    this.el.find('.tit').find('span').html(this.model.get('title_short'))
  },

  toggleEditMod: function(e){
      e.preventDefault()
      if (!this.edit_mod) { this.turn_edit_mod()  } 
      else { this.turn_of_edit_mod() }
   },


   toggleEditModDesc: function(e){
      e.preventDefault()
      if (!this.edit_mod_desc_flag) { this.edit_mod_desc({empty:false})  } 
      else { this.turn_of_edit_mod_desc() }
   },

    toggleEditModTitle: function(e){
      e.preventDefault()
      if (!this.edit_mod_title_flag) { this.edit_mod_title({empty:false}) } 
      else { this.turn_of_edit_mod_title() }
   },


   turn_edit_mod: function(){
     this.edit_mod_title()
     this.edit_mod_desc()
     this.rubricTurnEditMod()
   },


   edit_mod_title: function(options){
         if (!options) options = {empty:false}
         var val = this.model.get('title')
         val = options.empty ? '' : val
         this.el.find('.tit').find('span').html('<input class="input_edit" value="'+val+'" type="text" ></input>')
         this.edit_mod_title_flag = true;
   },

   edit_mod_desc: function(options){
     if (!options) options = {empty:false}
     val = this.model.get('description')
     val = options.empty ? '' : val
     this.el.find('.desc').find('span').html('<textarea class="area_edit" rows="4" cols="100">'+val+'</textarea>')
     this.edit_mod_desc_flag = true;
   },

   turn_of_edit_mod_title: function() {
     var title = this.el.find('.input_edit').val()
     var title_valid = this.model.set({title: title})
     if (title_valid) {
           this.edit_mod_title_flag = false
           this.model.trigger('change:title')
           this.model.save()
      } 

   },

  turn_of_edit_mod_desc: function() {
     var desc = this.el.find('textarea').val()
     var desc_valid = this.model.set({description: desc})
     if (desc_valid) {
           this.edit_mod_desc_flag = false
           this.model.trigger('change:description')
           this.model.save()
      } 
   },


  folderToggle: function(){
    if (!this.opend) { this.showLoader(); this.children.fetch({success: this.openFolder }) }
    else { this.children_container.slideUp(this.slideSpeed, this.closeFolder) }
  },


  openFolder : function(rs){
    this.hideLoader()
    if (rs.length !== 0) {
        this.options.parent_view.closeAllChildren()
        this.opend = true
        this.el.attr({'open':true})
        this.children_container.slideDown(this.slideSpeed)
        this.el.find('.open').attr({'class':'close'})
        this.el.find('.drop_shadow').css({'display':'inline'});
        this.el.find('.bottom_gray').hide();
        this.el.find('.drop_bottom').slideDown('fast');
        this.el.find('.scroll_fave').show();
      } else {
        this.el.find('.scroll_fave').hide();
        etv.utils.info_message('Папка "'+this.model.get('title')+'" пуста!')
      }
  },


  closeFolder: function(){
    this.opend = false
    this.children_container.html('')
    this.el.attr({'open':false})
    this.el.find('.close').attr({'class':'open'})
    this.el.find('.drop_shadow').css({'display':'none'});
    this.el.find('.bottom_gray').show();
    this.el.find('.drop_bottom').slideUp('fast');
    this.el.find('.scroll_fave').hide();
  },

  removeFolder: function(e){
    e.preventDefault();
    this.model.destroy();
    this.el.slideUp('slow', function(){this.remove})
  },

  render: function(){

    $(this.el).html(this.template(this.model.toJSON()))

    this.el.find('input').change(this.confirmSharedChanged)

    return this
  },

  confirmSharedChanged: function(){

    var val = $(this.el).find('input[name=shared]:checked').attr('value')
    
    if(val==1) {
      etv.utils.dialog_message(this.confirm_shared_message(), this.sharedChanged)
    } else {
      this.model.set({'shared':val})
      this.model.save()
    }

  },

  sharedChanged: function(confirm){
    var val = $(this.el).find('input[name=shared]:checked').attr('value')
    if (confirm) {
        var val = $(this.el).find('input[name=shared]:checked').attr('value')
        this.model.set({'shared':val})
        this.model.save()
    } else {
       $(this.el).find('input[name=shared]')[1].checked = 'checked';
    }
  },

  handleValidationError: function(model, error){
    if (typeof(error)=='string') {
     etv.utils.error_message(error)
   }
  }

});


// Bookmarks Main Viev 
etv.vid.bmark.BookmarksView = etv.vid.bmark.BaseView.extend({

  collection_class : etv.vid.bmark.Folders,

  childrens_view: etv.vid.bmark.FolderView,

  events: {
    "click .add_folder": "emptyForm",
  },

  initialize: function(attributes,options){
        this.rubrics = new etv.vid.bmark.FolderRubric
        this.rubrics.fetch()
        this.model = new etv.vid.bmark.AppModel
        etv.vid.bmark.BaseView.prototype.initialize.call(this, attributes, options);
        this.children.fetch()
    },
  

  closeAllChildren: function(){
    _.map(this.children_views, (function(view){ 
                 if (view.opend) {
                         view.children_container.slideUp(view.slideSpeed, view.closeFolder)
                         };
                    })
          )
  },

  emptyForm: function(e){
       e.preventDefault()
       var model = new etv.vid.bmark.Folder;
       this.children.add(model,{at:0});
       this.children_views[this.children_views.length-1].turn_edit_mod();
  }

});

