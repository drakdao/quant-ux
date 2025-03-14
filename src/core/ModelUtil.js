import lang from '../dojo/_base/lang'
import Logger from './Logger'

class ModelUtil {

    constructor() {
        this.designTokenCssProps = [
            'color',
            'fontSize',
            'fontWeight',
            'fontFamily',
            'textAlign',
            'letterSpacing',
            'lineHeight',
            'background',
            'boxShadow',
            'paddingTop',
            'paddingBottom',
            'paddingLeft',
            'paddingRight',
            'borderTopWidth',
            'borderRightWidth',
            'borderLeftWidth',
            'borderBottomWidth',
            'borderTopColor',
            'borderBottomColor',
            'borderRightColor',
            'borderLeftColor'
        ].map(t => 'dt-' + t)
    }

    
    getAllGroupChildren (group, model) {
        if (!group.children) {
          return []
        }
        let result = group.children.slice(0)
        if (group.groups) {
          group.groups.forEach(subId => {
            const sub = model.groups[subId]
            if (sub) {
              const children = this.getAllGroupChildren(sub, model)
              result = result.concat(children)
            } else {
              console.warn('ModelUtil.getAllGroupChildren() No sub group', subId)
            }
          })
        }
        return result
    }
  

    scaleToSelection(box, pos, type = '') {
        // for top and bottom we scale by height, otherwise by width
        if (type === 'North' || type === 'South') {
            const scale = pos.h / box.h
            const w =  Math.round(box.w * scale)
            const offset = (type === 'LeftUp' || type === 'LeftDown') ? (w - pos.w) : 0
            return {
                x: pos.x - offset,
                y: pos.y,
                w: w,
                h: pos.h
            }
        } else {
            const scale = pos.w / box.w
            const h =  Math.round(box.h * scale)
            const offset = (type === 'LeftUp' || type === 'RightUp' )? (h - pos.h) : 0   
            return {
                x: pos.x,
                y: pos.y - offset,
                w: pos.w,
                h: h
            }
        }
    }

    scaleToSelectionWidthOrHeight(box, pos, type = '') {
        const difW = Math.abs(box.w - pos.w)
        const difH = Math.abs(box.h - pos.h)
        // Or should we just make for north and south the heigth scalling
        if (difW > difH) {
            const scale = pos.w / box.w
            const h =  Math.round(box.h * scale)
            const offset = (type === 'LeftUp' || type === 'RightUp' )? (h - pos.h) : 0   
            return {
                x: pos.x,
                y: pos.y - offset,
                w: pos.w,
                h: h
            }
            
        } else {
            const scale = pos.h / box.h
            const w =  Math.round(box.w * scale)
            const offset = (type === 'LeftUp' || type === 'LeftDown') ? (w - pos.w) : 0
            return {
                x: pos.x - offset,
                y: pos.y,
                w: w,
                h: pos.h
            }
        }
    }

    isLogicWidget(widget) {
        return widget && (widget.type === 'LogicOr' || widget.type === "Rest" || widget.type === 'Script')
    }

    inlineAllTemplateVariants (model) {
        // FIXME: For speedup during rendering, we could also inline all the 
        // templates
        return model
    }

    inlineTemplateVariant (template, model) {
        if (template.variantOf) {
            let parent = model.templates[template.variantOf]
            if (parent) {
                // FIXME: we should be able to do this without copying the parent
                const copy = lang.clone(parent)
                this.mixinNewStyles(copy, template)
                template.style = copy.style
                template.hover = copy.hover
                template.error = copy.error
                template.active = copy.active
                template.focus = copy.focus
                return template
            }
        }
        return template
    }

    inlineModelDesignTokens(model) {
        /**
         * This is quite costly. Can we do this smarter? Maybe we could do it in the
         * RenderFactory (beawre of hover etc). Then we would have to just add here
         * for all the reference design token the modified?
         */
        if (model.designtokens) {
            for (let widgetID in model.widgets) {
                let widget = model.widgets[widgetID]
                this.inlineBoxDesignToken(widget, model)
            }
            for (let screenId in model.screens) {
                let scrn = model.screens[screenId]
                this.inlineBoxDesignToken(scrn, model)
            }
            /**
             * FIXME Add tempaltes
             */
        }
        return model
    }

    inlineBoxDesignToken(box, model) {
        /**
         * If the box is templates, we copy all the designtokens from the template
         */
        if (box && box.template && model.templates && model.templates[box.template]) {
            let template = model.templates[box.template]
            if (template.designtokens) {
                /**
                 * We could mix this in....
                 */
                box.designtokens = template.designtokens
            }
        }
        if (box && box.designtokens) {
            let designtokens = box.designtokens
            for (let state in designtokens) {
                if (!box[state]) {
                    box[state] = {}
                }
                let stateTokens = designtokens[state]
                for (let cssProp in stateTokens) {
                    let designTokenId = stateTokens[cssProp]
                    let designToken = model.designtokens[designTokenId]
                    if (designToken) {
                        if (designToken.isComplex) {
                            box[state][cssProp] = designToken.value[cssProp]
                        } else {
                            box[state][cssProp] = designToken.value
                        }
                    } else {
                        console.warn('ModelUtil.inlineBoxDesignToken() > NO token with id or no value:' + designTokenId, designToken)
                    }
                }
            }
        }
        return box
    }


    updateTemplateModifies(model) {
        /**
         * We set the template modfied date, so in RenderFlow we 
         * can recognize that we have to update the widget.
         */
        if (model && model.templates) {
            for (let widgetID in model.widgets) {
                const widget = model.widgets[widgetID]
                if (widget.template) {
                    const t = model.templates[widget.template];
                    if (t) {
                        widget._templateModified = t.modified
                    }
                }
            }
        }
        return model
    }

    inlineTemplateStyles(model) {
        for (let widgetID in model.widgets) {
            const widget = model.widgets[widgetID]
            if (widget.template) {
                let hover = this.getTemplatedStyle(widget, model, 'hover')
                if (hover) {
                    widget.hover = hover
                }
                let error = this.getTemplatedStyle(widget, model, 'error')
                if (error) {
                    widget.error = error
                }
                let focus = this.getTemplatedStyle(widget, model, 'focus')
                if (focus) {
                    widget.focus = focus
                }
                let active = this.getTemplatedStyle(widget, model, 'active')
                if (active) {
                    widget.active = active
                }
            }

        }
        return model
    }
    
    getStyle (widget, model) {
        if (widget.template) {
          if (model.templates) {
            const template = this.getMergedTemplate(widget.template, model);
            if (template) {
          
              /**
               * Merge in overwriten styles
               */
              const merged = lang.clone(template.style);
              if (widget.style) {
                for (let key in widget.style) {
                   merged[key] = widget.style[key];
                }
              }
              return merged;
            } else {
              console.warn("Layout.getStyle() > No template found for widget",widget.id, " with template ",  widget.template);
            }
          }
        }
        return widget.style;
    }

    getMergedTemplate (templateId, model) {
        const template = model.templates[templateId];
        /**
         * Since 4.0.60 templates can inherit other templates
         */
        if (template && template.variantOf) {
            let parent = model.templates[template.variantOf];
            if (parent) {
                parent = lang.clone(parent)
                this.mixinNewStyles(parent, template)
                // all props are now from the parent now!! Should only be used
                // to get the template style
                return parent
            }
        }
        return template
    }


    getTemplatedStyle(widget, model, prop = 'style') {
        if (widget.template) {
            if (model.templates) {
                const template = this.getMergedTemplate(widget.template, model);
                if (template && template[prop]) {
                    /**
                     * Merge in overwriten styles
                     */
                    const merged = lang.clone(template[prop])
                    if (widget[prop]) {
                        let props = widget[prop]
                        for (var key in props) {
                            merged[key] = props[key]
                        }
                    }
                    return merged;
                }
            }
        }
        return widget[prop];
    }

    getCopiesOfTemplate (template, model) {
        if (template.copyOf) {
            if (model.templates[template.copyOf]) {
                template = model.templates[template.copyOf]
            }
        }
        return Object.values(model.templates).filter(t => t.copyOf === template.id)
    } 

    getVariantesOfTemplate (template, model) {
        if (template.variantOf) {
            if (model.templates[template.variantOf]) {
                template = model.templates[template.variantOf]
            }
        }
        return Object.values(model.templates).filter(t => t.variantOf === template.id)
    } 

    createScalledModel(model, zoom, round = true) {

        if (!round) {
            Logger.log(1, 'ModelUtil.createScalledModel() > do not round!')
        }

        const zoomedModel = lang.clone(model);
        zoomedModel.isZoomed = true;

        this.getZoomedBox(zoomedModel.screenSize, zoom, zoom, round);

        for (let id in zoomedModel.widgets) {
            this.getZoomedBox(zoomedModel.widgets[id], zoom, zoom, round);
        }

        for (let id in zoomedModel.screens) {
            const zoomedScreen = this.getZoomedBox(
                zoomedModel.screens[id],
                zoom,
                zoom,
                round
            );

            /**
             * This has a tiny tiny bug that makes copy of the same screen jump as x and y and rounded()
             * To fix this, we should take the relative and x and y in the parent and round that...
             *
             * scalledWidget.x = scalledScreen.x + (orgWidget.x - orgScreen.x)*zoomX
             *
             * As an alternative we could stop using Math.round() ...
             */
            for (let i = 0; i < zoomedScreen.children.length; i++) {
                let wid = zoomedScreen.children[i];
                let zoomWidget = zoomedModel.widgets[wid];
                let orgWidget = model.widgets[wid];
                if (orgWidget) {
                    /**
                     * When we copy a screen we might not have the org widget yet
                     */
                    var orgScreen = model.screens[zoomedScreen.id];
                    var difX = this.getZoomed(orgWidget.x - orgScreen.x, zoom, round);
                    var difY = this.getZoomed(orgWidget.y - orgScreen.y, zoom, round);
                    if (orgWidget.parentWidget) {
                        if (zoomWidget.x >= 0) {
                            zoomWidget.x = zoomedScreen.x + difX;
                        }
                        if (zoomWidget.y >= 0) {
                            zoomWidget.y = zoomedScreen.y + difY;
                        }
                    } else {
                        zoomWidget.x = zoomedScreen.x + difX;
                        zoomWidget.y = zoomedScreen.y + difY;
                    }
                }
            }
        }

        for (let id in zoomedModel.lines) {
            let line = zoomedModel.lines[id];
            for (let i = 0; i < line.points.length; i++) {
                this.getZoomedBox(line.points[i], zoom, zoom, round);
            }
        }

        return zoomedModel;
    }

   
    getZoomedBox(box, zoomX, zoomY, round = true) {
        if (box.x) {
            box.x = this.getZoomed(box.x, zoomX, round);
        }

        if (box.y) {
            box.y = this.getZoomed(box.y, zoomY, round);
        }
        if (box.w) {
            box.w = this.getZoomedCeil(box.w, zoomX, round);
        }
        if (box.h) {
            box.h = this.getZoomedCeil(box.h, zoomY, round);
        }
        if (box.min) {
            box.min.h = this.getZoomed(box.min.h, zoomY, round);
            box.min.w = this.getZoomed(box.min.w, zoomX, round);
        }
        box.isZoomed = true;
        return box;
    }
  
    getZoomed(v, zoom, round = true) {
        if (round) {
            return Math.round(v * zoom);
        }
        return v * zoom
    }

    getZoomedCeil(v, zoom, round = true) {
        if (round) {
            return Math.ceil(v * zoom);
        }
        return v * zoom
    }
    

    updateInheritedRefs(model) {
        for (let screenId in model.screens) {
            let screen = model.screens[screenId]
            /**  
             * We need to update master refs only for screens
             * that have a master
             */
            if (screen.parents && screen.parents.length > 0) {
                this.updateErrorLabelsInScreen(screen, model)
            }

        }
        return model
    }

    updateErrorLabelsInScreen(screen, model) {
        screen.children.forEach(id => {
            let widget = model.widgets[id]
            /**
             * Inherited input widgets might have errorLabels attached. These will
             * point to the ids in the master screen and need to be updated.
             */
            if (widget.inherited) {
                if (widget.props && widget.props.refs) {
                    let errorLabels = widget.props.refs.errorLabels
                    if (errorLabels) {
                        /**
                         * Update all error labels by adding the current screen id
                         */
                        let inheritedErrorLabels = errorLabels.map(l => l + '@' + screen.id)
                        widget.props.refs.errorLabels = inheritedErrorLabels
                    }
                }
            }
        })
    }

    setMergedTemplateStyle(widget, template, mode) {
        if (template[mode]) {
            if (!widget[mode]) {
                widget[mode] = {}
            }
            let style = template[mode]
            for (let key in style) {
                if (widget[mode][key] === undefined) {
                    widget[mode][key] = style[key]
                }
            }
        }
    }

    updateTemplateStyle(widget, template, mode) {
        // copy all widget style back to template
        // and reset template
        if (widget[mode]) {
			const style = widget[mode]
			if (!template[mode]) {
				template[mode] = {}
			}
			for (let key in style) {
				const value = style[key]
				template[mode][key] = value
			}
			widget[mode] = {};
		}
    }

    setStylesNotInTemplate(widget, template, mode) {
        if (widget[mode]) {
            let result = {}
            if (widget[mode] && template[mode]) {
                let widgetStyle = widget[mode]
                let templateStyle = template[mode]
                for (let key in widgetStyle) {
                    if (templateStyle[key] !== widgetStyle[key]) {
                        result[key] = widgetStyle[key]
                    }
                }
            }
            widget[mode] = result
        }
	}

    getViewModeStyle (widget, model, widgetViewMode) {
     
        // we get the default style. This method
		// will take the template and mix in 
		// the nornal "style" overwrites
		const normal = this.getTemplatedStyle(widget, model, 'style');
        const mixed = lang.clone(normal);

        // if we have specific overwrite in the template
        // for the given widgetViewMode, we mix this in and
        // overwrite the values
        if (widget.template && model.templates[widget.template]) {
            /**
             * Since 4.0.60 we need to get potentially also a 
             * check variants
             */
            const template = this.getMergedTemplate(widget.template, model)
            if (template && template[widgetViewMode]) {
                const templateStyle = template[widgetViewMode]
                for (let key in templateStyle) {
                    mixed[key] = templateStyle[key];
                }
            }
        }
        // last we mix in values that are defined 
        // in the widget
        if ( widget[widgetViewMode]) {
            const widgetStyle = widget[widgetViewMode];
            for (let key in widgetStyle){
                mixed[key] = widgetStyle[key];
            }
        }
        
        return mixed;
    }

    getCanvasWidgets (model) {
        const result = []
        const widgetsOnScreens = {}
        Object.values(model.screens).forEach(s => {
            s.children.forEach(id => {
                widgetsOnScreens[id] = true
            })
        })
        Object.values(model.widgets).forEach(w => {
            if (!widgetsOnScreens[w.id]) {
                result.push(w)
            }
        })
        return result
    }


    getWidgetsByTemplate(templateId, model) {
        let result = []
        for (let widgetID in model.widgets) {
            let widget = model.widgets[widgetID]
            if (widget.template === templateId) {
                result.push(widget)
            }
        }
        return result
    }

    getGroupsByTemplate(templateId, model) {
        let result = []
        for (let groupID in model.groups) {
            let group = model.groups[groupID]
            if (group.template === templateId) {
                result.push(group)
            }
        }
        return result
    }

    mixin (target, source) {
        const result = lang.clone(target)
        for (let key in source) {
            result[key] = source[key]
        }
        return result
    }

    mixinNewStyles (target, source) {
		target.style = this.mixin(target.style, source.style);

		if (target.hover) {
			target.hover = this.mixin(target.hover, source.hover);
		}
		if (target.error) {
			target.error = this.mixin(target.error, source.error);
		}
		if (target.active) {
			target.active = this.mixin(target.active, source.active);
		}
		if (target.focus) {
			target.focus = this.mixin(target.focus, source.focus);
		}
		if (target.designtokens) {
			target.designtokens = lang.clone(target.designtokens);
		}
	}

}

export default new ModelUtil()