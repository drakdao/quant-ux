<script>

import on from 'dojo/on'
import lang from 'dojo/_base/lang'
import win from 'dojo/_base/win'
import css from 'dojo/css'
import topic from 'dojo/topic'
import CoreUtil from 'core/CoreUtil'
import ModelResizer from 'core/ModelResizer'
import ModelUtil from 'core/ModelUtil'

export default {
    name: 'Resize',
    mixins:[],
    data: function () {

      return {
      }
    },
    components: {},
    methods: {


      showGroupResizeHandlers (children,groupID, type){
        /**
         * we hack how a little and will pass an id to the bounding box,
         * so that the _DargNDrop._dragNDropUpDateUI method will also move
         * the resize handles. To do so, we select the left upper child that is in
         * the bounding box.
         *
         * FIXME: here is a bug! We have an issue, if no widget is in the upper left corner alone,
         * for instance the cross.
         */
        const boundingBox = this.getBoundingBox(children);
        for(let i=0; i< children.length; i++){
          const id = children[i];
          // var widget = this.model.widgets[id];
          //if(widget.x == boundingBox.x  widget.y == boundingBox.y){
            boundingBox.id = id;
            break;
          //}
        }
        this.showResizeHandles(boundingBox,groupID, null, type, true);
      },


      _updateGroupResizeHandlers (children,groupID, type) {
          const boundingBox = this.getBoundingBox(children);
          this._updateResizeHandlers(boundingBox,groupID, null, type, true);
      },



      showResizeHandles (box, id, parent, modelType, drawLines) {
 
        if (!this.resizeEnabled){
          return;
        }

        if(!this.handlers){
          this.handlers = {};
        }

        /**
         * add corners. For screen we have only the south handler...
         */
        if (modelType != "inheritedWidget") {
          const l = (this.resizeButtonSize * 2) +1;
          if (modelType == "screen"){
            this._renderResizeHandler('South', l, parent, id, modelType);

            if (box.style && box.segment) {
              this._renderResizeHandler('East', l, parent, id, modelType);
            }

          } else {
            const locked = box.style && box.style.locked;
            const noResize = box.has && box.has.noresize;
            if(!noResize && !locked){
              this._renderResizeHandler('RightUp', l, parent, id, modelType);
              this._renderResizeHandler('LeftUp', l, parent, id, modelType);
              this._renderResizeHandler('RightDown', l, parent, id, modelType);
              this._renderResizeHandler('LeftDown', l, parent, id, modelType);

              this._renderResizeHandler('North', l, parent, id, modelType);
              this._renderResizeHandler('West', l, parent, id, modelType);
              this._renderResizeHandler('East', l, parent, id, modelType);
              this._renderResizeHandler('South', l, parent, id, modelType);
            }
          }
        }


        if(drawLines){
          this._renderResizeLine("Left");
          this._renderResizeLine("Right");
          this._renderResizeLine("Up");
          this._renderResizeLine("Down");
        }

        if (this.hasPrototypingView) {
          this._renderPrototypingHandler('Link', (this.prototypingButtonSize * 2), parent, id, modelType);
        }

        this._selectedParent = parent;
        this._resizeHandlerBox = box;


        this._updateResizeHandlers(box);

        return parent;
      },

      _renderPrototypingHandler (type, l, parent, id, modelType){

        if (modelType === 'multi') {
          return
        }

        /**
         * Do not show the lines for
         */
        if (modelType === 'widget') {
          let widget = this.model.widgets[id]
          if (!ModelUtil.isLogicWidget(widget)) {
					  let lines = this.getFromLines(widget)
						if (lines.length > 0) {
              return
            }
          }
        }

        if (modelType === 'group') {
          let group = this.model.groups[id]
          let lines = this.getFromLines(group)
          if (lines.length > 0) {
            return
          }
        }

        const div = document.createElement("div");
        div.style.width = l + "px";
        div.style.height = l + "px";
        css.add(div, "MatcResizeHandle MatcPrototypingHandle ");
        this._addSizeHandlerTouch(div);
        this.dndContainer.appendChild(div);
        this.handlers[type] = div;
        this.registerPrototypingHandler(div, parent, id, type, modelType);
      },

      _renderResizeHandler (type, l, parent, id, modelType){
        const div = document.createElement("div");
        div.style.width = l + "px";
        div.style.height = l + "px";
        css.add(div, "MatcResizeHandle MatchResize"+type);
        this._addSizeHandlerTouch(div);
        this.dndContainer.appendChild(div);
        this.handlers[type] = div;
        this.registerResizeListener(div, parent, id, type, modelType);
      },

      _renderResizeLine (type){
        const div = document.createElement("div");
        div.style.height="1px"
        div.style.width="1px"
        css.add(div, "MatcResizeBorder MatcResizeBorder"+type);
        this.handlers[type] = div;
        this.dndContainer.appendChild(div);
      },

     
      _updateResizeHandlers (boundingBox){

        const box = boundingBox
       
        if (this.handlers && box && this.resizeEnabled) {
          if (this.handlers['LeftUp']) {
            this.handlers['LeftUp'].style.top = box.y  + (-1* this.resizeButtonSize) + "px";
            this.handlers['LeftUp'].style.left = box.x  + (-1* this.resizeButtonSize)+ "px";

            this.handlers['RightUp'].style.top = box.y  + (-1* this.resizeButtonSize) + "px";
            this.handlers['RightUp'].style.left = (box.x + box.w) + (-1* this.resizeButtonSize)+ "px";

            this.handlers['RightDown'].style.top = (box.y + box.h) - this.resizeButtonSize + "px";
            this.handlers['RightDown'].style.left = (box.x + box.w) - this.resizeButtonSize+ "px";

            this.handlers['LeftDown'].style.top = (box.y + box.h) - this.resizeButtonSize + "px";
            this.handlers['LeftDown'].style.left = (box.x) - this.resizeButtonSize+ "px";
          }

          if (this.handlers['Left']) {
            this.handlers['Left'].style.height= box.h +"px"
            this.handlers['Left'].style.top = box.y + "px";
            this.handlers['Left'].style.left = box.x -1 +"px";

            this.handlers['Right'].style.height= box.h +"px"
            this.handlers['Right'].style.top = box.y + "px";
            this.handlers['Right'].style.left = (box.x + box.w) +"px";

            this.handlers['Up'].style.width= box.w +"px"
            this.handlers['Up'].style.top = box.y -1 + "px";
            this.handlers['Up'].style.left = (box.x) +"px";

            this.handlers['Down'].style.width= box.w +"px"
            this.handlers['Down'].style.top = (box.y + box.h) + "px";
            this.handlers['Down'].style.left = (box.x) +"px";
          }

          if (this.handlers['North']) {
            this.handlers['North'].style.top = box.y  + (-1* this.resizeButtonSize) + "px";
            this.handlers['North'].style.left = (box.x + box.w/2)+ (-1* this.resizeButtonSize)+ "px";

            this.handlers['West'].style.top = box.y +(box.h/2) + (-1* this.resizeButtonSize) + "px";
            this.handlers['West'].style.left = (box.x) + (-1* this.resizeButtonSize)+ "px";
          }

          /**
           * Since 2.2.0 we have screen segements
           */
          if (this.handlers['East']) {
            this.handlers['East'].style.top = box.y +(box.h/2) + (-1* this.resizeButtonSize) + "px";
            this.handlers['East'].style.left = (box.x + box.w)+ (-1* this.resizeButtonSize)+ "px";
          }

          if (this.handlers['South']) {
            this.handlers['South'].style.top = box.y +box.h + (-1* this.resizeButtonSize) + "px";
            this.handlers['South'].style.left = (box.x + box.w/2)+ (-1* this.resizeButtonSize)+ "px";
          }

          if (this.handlers['Link']) {
            this.handlers['Link'].style.top = box.y +(box.h/2) + (-1* this.prototypingButtonSize) + "px";
            this.handlers['Link'].style.left = (box.x + box.w)+ (-1* this.prototypingButtonSize)+ "px";
          }

          if (this.updateCustomHandlers) {
            this.updateCustomHandlers(box)
          }
        }
      },

      /**
       * add some invisible touch handler to make it easier to grap it.
       */
      _addSizeHandlerTouch (node){
        var t = document.createElement("div");
        css.add(t, "MatcResizeHandleTouch");
        node.appendChild(t);
      },

      cleanUpResizeHandles (){

        if(this.handlers){
          for(var id in this.handlers){
            var node = this.handlers[id];
            var parent = node.parentNode;
            if(parent){
              parent.removeChild(node);
            }
          }
        }
        this.handlers = null;
        this._selectedParent = null;

        if(this._resizeHandleListeners){
          for(var i=0; i < this._resizeHandleListeners.length; i++){
            this._resizeHandleListeners[i].remove();
          }
        }

        delete this._resizeHandleListeners;
        delete this._resizeHandlerBox;
        this.onResizeDnDCleanUp();
        if (this.cleanUpCustomHandlers) {
          this.cleanUpCustomHandlers();
        }
      },





      /**********************************************************************
       * DND: We have to drag and drop
       **********************************************************************/

      registerResizeListener (div, parent, id, type, modelType){
        if(!this._resizeHandleListeners){
          this._resizeHandleListeners = [];
        }
        var listener = on(div,"mousedown", lang.hitch(this,"onResizeDnDStart", div,parent, id, type, modelType));
        this._resizeHandleListeners.push(listener);
      },

      registerPrototypingHandler (div){
        if(!this._resizeHandleListeners){
          this._resizeHandleListeners = [];
        }
        var listener = on(div,"mousedown", (e) => {
           this.stopEvent(e)
           this.addLineAtSelected(e, true)
        });
        this._resizeHandleListeners.push(listener);
      },


      onResizeDnDStart (div, parent, id, type,modelType,e){
        this.stopEvent(e);
        this.logger.log(3,"onResizeDnDStart", "enter > "+  id);
        topic.publish("matc/canvas/click", "", "");


        /**
         * make sure inline edit is flushed,
         * because a renrender or some other stuff might
         * happen
         */
        this.inlineEditStop();

        // this is wrong if we want to have snappz stuff
        // we have to select depending on the type.. arghh
        this._resizeStartPos = this.getCanvasMousePosition(e);
        this._resizeHandleDiv = div;
        this._resizeParentDiv = parent;
        this._resizeType = type;
        this._resizeId = id;
        this._resizeModelType = modelType;
        this._resizeRenderJobs = {};
        this._resizeCursor = "MatcCanvasResizeCursor" + type

        css.add(this.container, this._resizeCursor);

        /**
         * we have to get the right model object. For groups and mutli
         * we set the bounding box.
         */
        this.getResizeModel(id)

        /**
         * start the alignment, like grid or ruler!
         */
        this.alignmentStart(modelType, this._resizeModel, type, null, true);

        /**
         * register mouse move and release listener, maybe also esc listener
         */
        this._resizeHandleMove = on(win.body(),"mousemove", lang.hitch(this,"onResizeDnDMove", modelType));
        this._resizeHandleUp = on(win.body(),"mouseup", lang.hitch(this,"onResizeDnDEnd", modelType));
      },

      getResizeModel (id) {
        if (this._resizeModelType == "screen"){
          this._resizeModel = this.model.screens[id];
        } else if(this._resizeModelType == "widget"){
          this._resizeModel = this.model.widgets[id];
        } else if(this._resizeModelType == "group"){
          this._resizeModel = this.getBoundingBox(this._selectGroup.children);
          this._resizeModel.children = this._selectGroup.children;
        } else if(this._resizeModelType == "multi"){
          this._resizeModel = this.getBoundingBox(this._selectMulti);
          this._resizeModel.children = this._selectMulti;
        }
      },

      onResizeDnDMove (modelType, e){


        this.stopEvent(e);
        if(!this._resizeHandleDiv || !this._resizeModel){
          this.logger.warning(0,"onResizeDnDMove", "No model or handler");
          this.onResizeDnDCleanUp();
          return;
        }

        // dispatch to special handler if attached
        if(this._resizeDnDMoveHandler){
          this[this._resizeDnDMoveHandler](modelType, e)
          return;
        }

        // get snapped position
        var pos = this._getSizePos(e);


        if (modelType !== "group" && modelType !== "multi"){
          /**
           * Normal screen or widgedt. Now build the job
           */
          this._resizeRenderJobs[pos.id] = {
            "pos" : pos,
            "div" : this._resizeParentDiv
          };
        } else {
          if (modelType === "multi" && this._distributeEnabled) {
            /**
             * Distribute
             */
            let dir = this.isHorinzontalDistribution()
            let temp = this._distributedPositions(dir, this._resizeModel.children, pos);
            let positions = temp.positions;
            for(let id in positions){
              let newPos = positions[id]
              let div = this.widgetDivs[id];
              this._resizeRenderJobs[id] = {
                "pos" : newPos,
                "div" : div
              };
            }
            this.alignmentShowDistribution(temp.distances);
          } else {
            /**
             * Calculate relative changes in size.
             */
            let dif ={
              x: pos.x *1.0 / this._resizeModel.x,
              y: pos.y *1.0 / this._resizeModel.y,
              w: pos.w *1.0 / this._resizeModel.w,
              h: pos.h *1.0 / this._resizeModel.h
            };

            let children = this._resizeModel.children;
            for(let i=0; i< children.length; i++){
              let id = children[i];
              let widget = this.model.widgets[id];
              let div = this.widgetDivs[id];
              let newPos = this._getGroupChildResizePosition(widget,this._resizeModel,pos, dif)
              this._resizeRenderJobs[id] = {
                "pos" : newPos,
                "div" : div
              };
            }
          }

          /**
           * in case of group we also set the bounding box,
           * to make sure all lines are correctly updated
           */
          if (modelType === "group"){
            pos.id = this._resizeId;
            this._resizeRenderJobs[this._resizeId] = {
              "pos" : pos
            };
          }
        }

        /**
         * make sure handler are also updated
         */
        this._resizeRenderJobsHandlerPos = pos;

        /**
         * now request rendering
         */
        if(!window.requestAnimationFrame){
          console.warn("No requestAnimationFrame()");
            this._resizeDndUpDateUI();
          } else {
            var callback = lang.hitch(this, "_resizeDndUpDateUI");
              requestAnimationFrame(callback);
          }
        return false;
      },

      onResizeDnDEnd (modelType, e){
        this.logger.log(1,"onResizeDnDEnd", "enter");
        this.stopEvent(e);

        if(!this._resizeStartPos){
          this.onResizeDnDCleanUp();
          return;
        }

        // return if we have special handler
        if (this._resizeDnDEndHandler){
          this[this._resizeDnDEndHandler](modelType, e);
          return;
        }

        this._resizeNewPosition = this.getCanvasMousePosition(e);
        this._resizeNewPosition.x -= this._resizeStartPos.x;
        this._resizeNewPosition.y -= this._resizeStartPos.y;

        /**
         * calculate new position of widget (or bounding box) and
         * align it with snapping.
         */
        var pos = this._getResizePosition(this._resizeNewPosition, this._resizeModel, this._resizeType);
        pos = this.allignPosition(pos, e);
        //pos = this.allignToKeyBoard(pos,e);

        /**
         * Copy new pos, so DND will correctly be updated.
         * Make sure the id stays the same!
         */
        this._resizeHandlerBox.x = pos.x;
        this._resizeHandlerBox.y = pos.y;
        this._resizeHandlerBox.w = pos.w;
        this._resizeHandlerBox.h = pos.h;

        if (modelType !== "group" && modelType !== "multi"){

          /**
           * call aligner to snap to ruler of grid
           */
          if (this._resizeModelType == "screen"){
            this.controller.updateScreenPosition(this._resizeId, pos, false);
          } else {

            var widget = this.model.widgets[this._resizeId];

            let sourcePos = this.controller.updateWidgetPosition(this._resizeId, pos, false, this.isMasterWidget(widget));
            if (sourcePos) {

              /**
               * We use here the source position to also show snapping
               */
              this.renderFactory.resize(this._resizeId, sourcePos);

              /**
               * Also update with the real snapped one
               */
              let zoomedPos = CoreUtil.getZoomedBoxCopy(sourcePos, this.getZoomFactor(), this.getZoomFactor());
              this.setWidgetPosition(widget.id, sourcePos, zoomedPos);

            } else {
              this.logger.warn("onResizeDnDEnd", "no source pos");
            }

          }
        } else {
          if (modelType === "multi" && this._distributeEnabled) {
            /**
             * Distribute
             */
            let dir = this.isHorinzontalDistribution();
            let temp = this._distributedPositions(dir, this._resizeModel.children, pos);
            let positions = temp.positions;

            let children = this._resizeModel.children;
            let hasCopies = false;
            for(let i=0; i< children.length; i++){
              let id = children[i];
              let widget = this.model.widgets[id];
              hasCopies = hasCopies || this.isMasterWidget(widget);
            }
            // FIXME: We could have here a nice methods in the controller
            // to work on the unzoomed model and avoid rounding errors!
            this.getController().updateMultiWidgetPosition(positions, false, null, hasCopies);
          } else {
            /**
             * Calculate relative changes in size.
             */
            let dif ={
              x: pos.x *1.0 / this._resizeModel.x,
              y: pos.y *1.0 / this._resizeModel.y,
              w: pos.w *1.0 / this._resizeModel.w,
              h: pos.h *1.0 / this._resizeModel.h
            };
            let positions = {};
            let children = this._resizeModel.children;
            let hasCopies = false;
            for(let i=0; i< children.length; i++){
              let id = children[i];
              let widget = this.model.widgets[id];
              hasCopies = hasCopies || this.isMasterWidget(widget);
              // let div = this.widgetDivs[id];
              let newPos = this._getGroupChildResizePosition(widget, this._resizeModel, pos, dif)
              positions[id] = newPos;
            }
            // FIXME: Add here new API to to do the multi position calculation again in
            // to avoid rounding issues.
            // Basically we have to move this entire method to the controller!!
            this.getController().updateMultiWidgetPosition(positions, false, null, hasCopies);
          }
        }

        this.onResizeDnDCleanUp();
      },

  	_getSizePos (e){
			var pos = this.getCanvasMousePosition(e);
			pos.x -= this._resizeStartPos.x;
			pos.y -= this._resizeStartPos.y;

			pos = this._getResizePosition(pos, this._resizeModel, this._resizeType);

			/**
			 * *ATTENTION* We snapp now here and not in the _resizeDndUpDateUI()
			 * anymore. Otherwise we have some stupid jumpy effects...
			 */
			pos = this.allignPosition(pos, e);
			//pos = this.allignToKeyBoard(pos,e);
			return pos;
		},

		/**
		 * drawing method that updates the thing
		 */
		_resizeDndUpDateUI (){
			if(!this._resizeRenderJobs){
				this.onResizeDnDCleanUp();
				return;
			}

			for(var id in this._resizeRenderJobs){
				var job = this._resizeRenderJobs[id];
				var pos = job.pos;
        let sourcePos = CoreUtil.getUnZoomedBoxCopy(pos, this.zoom, this.zoom);
				let div = job.div;
				if(div){
					/**
					 * render parent (widget / screendnd)
					 */
					this.domUtil.setPos(div, pos)
					div.style.width = pos.w + "px";
					div.style.height = pos.h + "px";

					/**
					 * Also update the background things
					 */
					if (this._resizeModelType == "screen"){
						div = this.screenBackgroundDivs[id];
						this.domUtil.setPos(div, sourcePos)
						div.style.width = sourcePos.w + "px";
						div.style.height = sourcePos.h + "px";

					  let gridDiv = this.screenGridDivs[id];
						this.domUtil.setPos(gridDiv, sourcePos)
						gridDiv.style.width = sourcePos.w + "px";
						gridDiv.style.height = sourcePos.h + "px";

					} else {
						div = this.widgetBackgroundDivs[id];
						if(div){
							this.domUtil.setPos(div, sourcePos)
							div.style.width = sourcePos.w + "px";
							div.style.height = sourcePos.h + "px";
						}
					}
				}

				/**
				 * Also update the ui on the fly. Here we need to
         * use the source
				 */
				this.renderFactory.resize(id, sourcePos);

				/**
				 * update lines
				 */
				this.resizeUpdateLines(pos);

				/**
				 * FIXME: can this lead to concurreant loop exceptions?
				 */
				delete this._resizeRenderJobs[pos.id];
			}

			/**
			 * now update all handlers
			 */
			if(this._resizeRenderJobsHandlerPos){
				this._updateResizeHandlers(this._resizeRenderJobsHandlerPos);
			}
		},

		/**
		 * Calculates the correct dimensions depending on the new mouse pos
		 * and the type of handle.
		 *
		 * Returns a complete box with x,y,w,h and *id* !!
		 */
		_getResizePosition (pos, model, type){
			return ModelResizer.getResizePosition(pos, model, type, this._resizeModel)
		},


		/**
		 * FIXME: This should be merged with the
		 * DnD.updateLines() method in the DnD package
		 */
		resizeUpdateLines (box){
			if(box.id){
				for(var id in this.model.lines){
					var line = this.model.lines[id];
					if(line.to == box.id || line.from == box.id){
						//var from = this.model.widgets[line.from];
						//var to = this.model.screens[line.to];

						var from =  this.getFromBox(line);
						var to = this.getToBox(line);
						/**
						 * Here we switch he
						 */
						if(line.to == box.id){
							to = box;
						}
						if(line.from == box.id){
							from = box;
						}
						this.updateLine(line, from, to);
					}
				}

				/**
				 * Check also for groups children or so
				 */
			}

		},


		onResizeDnDCleanUp (){
			if(this._resizeHandleMove){
				this._resizeHandleMove.remove();
			}
			if(this._resizeHandleUp){
				this._resizeHandleUp.remove();
			}
			if (this._resizeCursor && this.container){
				css.remove(this.container, this._resizeCursor);
			}
			delete this._resizeHandleUp;
			delete this._resizeHandleMove;
			delete this._resizeStartPos;
			delete this._resizeNewPosition;
			delete this._resizeHandleDiv;
			delete this._resizeType;
			delete this._resizeModel;
			delete this._resizeId;
			delete this._resizeParentDiv;
			delete this._resizeContainerDiv;
			delete this._resizeModelType;
			delete this._resizeRenderJobs
			delete this._resizeRenderJobsHandlerPos;
			delete this._resizeDnDMoveHandler;
			delete this._resizeDnDEndHandler
			delete this._selectCloneIds;
			delete this._resizeCopyJobs;
			this.cleanUpAlignment();
			this.cleanUpReplicate();
			this.cleanupDistribute();
			css.remove(this.container, "MatcCanvasModeReplicate");
		},

			/**
			 * Keep this method here, so the analztic canvas won#t crash
			 */
			cleanupDistribute () {

      },

			isHorinzontalDistribution () {
				if (this._resizeType === "East" || this._resizeType === "West"){
					return "horizontal";
				} else {
					return "vertical";
				}
			},


			extendSelectionToGroup (widgetId, selection) {
				let group = this.getParentGroup(widgetId);
				if (group) {
					this.logger.log(1,"extendSelectionToGroup", "extend group for widget : " + widgetId, group);
					let children = group.children
					children.forEach(childId => {
						if (selection.indexOf(childId) < 0) {
							selection.push(childId)
						}
					})
				}
				return selection
			}


		}

}
</script>