/**!
 * @fileOverview claz.js - no prototype OOP for js
 * @author <a href="mailto:ziohimself@gmail.com">Serhiy "seruji" Onyshchenko</a>
 * @requires <a href="http://underscorejs.org/">underscorejs</a>
 * Licensed under
 * <a href="http://www.opensource.org/licenses/mit-license">MIT License</a>
 * */
(function(root, factory){
    function _defineNodeExports() {
        //noinspection JSUnresolvedVariable,JSUnresolvedFunction
        module.exports = factory(require('underscore'));
    }
    function _defineViaAmd() {
        define(['underscore'], factory);
    }
    function _commonjsDefine() {
        var _prev = root['claz'],
            _current = factory(root['_']);
        root['claz'] = _current;
        root['claz'].noConflict = function() {
            root['claz'] = _prev;
            return _current
        }
    }

    /** @see <a href="https://github.com/umdjs/umd/blob/master/returnExports.js">exports doc</a> */
    //noinspection JSUnresolvedVariable
    if (typeof exports === 'object') {
        // Node
        return _defineNodeExports()
    }
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        return _defineViaAmd()
    }
    // Browser globals (root is window)
    return _commonjsDefine()
})(this, function(_){
    /**
     * (one may read as `class`)
     * @param {function} [initFn] (optional parameter) - function, called on an object construction
     * @param {object} members (obligatory parameter) - A plain object, containing member definitions - member name as property key and member as property value
     * @returns {function} - the resulting class factory function
     * */
    function claz(initFn, members) {
        if (arguments.length === 1) {
            members = arguments[0];
        }
        if (!_isPlainObject(members)) {
            throw new TypeError('unsupported members type!')
        }

        var _initFnOrNull = _getInitFnOrNull(initFn, members),
            _publicMembers = _getPublicMembers(members);
        var Ctor = function (){
            var _members = Ctor[_memberzPropName],
                _privateThis = _.extend({}, _members);
            if (_.isFunction(_initFnOrNull)) {
                _initFnOrNull.apply(_privateThis, arguments)
            }
            var _getPrivateThis = function(){ return _privateThis },
                _getPublicThis = function(){ return publicThis };
            _privateThis = _.reduce(
                _privateThis,
                _.partial(_delegateToCopyOfThis, _getPrivateThis, _getPublicThis),
                {}
            );
            //noinspection UnnecessaryLocalVariableJS
            var publicThis = _getPublicMembers(_privateThis);
            return publicThis
        };

        _.extend(Ctor.prototype, _publicMembers);
        Ctor[_memberzPropName] = members;
        return Ctor
    }
    function _delegateToCopyOfThis(getPrivateThis, getPublicThis, self, member, memberName){
        if (!_.isFunction(member)) {
            self[memberName] = member;
            return self
        }
        self[memberName] = _getDelegatedFn(getPrivateThis, getPublicThis, member);
        return self
    }
    function _getDelegatedFn(getPrivateThis, getPublicThis, member){
        return function(){
            var _privateThis = getPrivateThis(),
                _publicThis = getPublicThis(),
                _context = _.extend({}, _privateThis, _publicThis),
                _args = _.toArray(arguments);
            return member.apply(_context,_args);
        }
    }
    function _isPlainObject(obj) {
        return _toString.call(obj) === '[object Object]'
    }
    /**
     * @param {object} members - a plain object, containing member definitions - member name as property key and member as property value
     * @returns {object} - a plain object, containing only the keys, which do not start with `_` (underscore character) and the values for those keys are functions
     * */
    function _getPublicMembers(members) {
        return _.reduce(
            members,
            function(publicMethods, member, memberName) {
                if(!_.isString(memberName) || /^_/g.test(memberName)) {
                    return publicMethods
                }
                publicMethods[memberName] = member;
                return publicMethods
            },
            {}
        )
    }
    function _getInitFnOrNull(initFnOrNone, members) {
        if (_.isFunction(initFnOrNone)) {
            return initFnOrNone
        }
        return _getInitFnFromMembersOrNull(members)
    }
    function _getInitFnFromMembersOrNull(members) {
        var initFn = members.init;
        if(!_.isFunction(initFn)) {
            return null
        }
        return initFn
    }

    /**
     * (one may read as `with`)
     * @param {function} baseClas - the class factory function to be augumented
     * @param {...function} clas - class(es) to be mixed in
     * */
    function wiz(baseClas, clas){
        if (!_.isFunction(baseClas)) {
            throw new TypeError("#wiz: baseClas=`"+ baseClas +"` is not a class factory function!")
        }
        if (!_isPlainObject(baseClas[_memberzPropName])) {
            throw new TypeError("#wiz: baseClas=`"+ baseClas +"` baseClas."+ _memberzPropName +"=`"+ baseClas[_memberzPropName] +"` is not the members object!")
        }
        //noinspection UnnecessaryLocalVariableJS
        var _clases = _slice.call(arguments,1);
        _clases.push(baseClas);
        //noinspection UnnecessaryLocalVariableJS
        var _methods4Mix = _.chain(_clases)
                .reduce(
                    _wizMixinMethodsForClaz,
                    {}
                )
                .reduce(
                    _wizComposeMethods,
                    {}
                )
                .value(),
            _members4Mix = _.reduce(
                _clases,
                _wizMixinMembersForClaz,
                {}
            ),
            _mixinz = _slice.call(arguments, 1),
            _memberz = _.extend({}, _members4Mix, _methods4Mix),
            _publicMethods4Mix = _getPublicMembers(_methods4Mix),
            _proto = _.extend(baseClas.prototype, _publicMethods4Mix, baseClas.prototype);
        baseClas[_memberzPropName] = _memberz;
        baseClas[_wizPropName] = _mixinz;
        baseClas.prototype = _proto;
        return baseClas
    }
    function _wizMixinMethodsForClaz(methods, clas) {
        if (!_.isFunction(clas)) {
            throw new TypeError("#_wizMixinMethodsForClaz clas=`"+ clas +"` is not a class factory function!")
        }
        if (!_isPlainObject(clas[_memberzPropName])) {
            throw new TypeError("#_wizMixinMethodsForClaz clas=`"+ clas +"` clas."+ _memberzPropName +"=`"+ claz[_memberzPropName] +"` is not the members object!")
        }
        methods = _.reduce(
            clas[_memberzPropName],
            _wizMixinMethod,
            methods
        );
        return methods
    }
    function _wizMixinMethod(methods, member, memberName) {
        if (!_.isArray(methods)) {
            throw new TypeError("#_wizMixinMethod: methods=`"+ methods +"` is not an array!")
        }
        if (!_.isString(memberName)) {
            throw new TypeError("#_wizMixinMethod: memberName=`"+ memberName +"` is not a string!")
        }
        if (!_.isFunction(member)) {
            return methods
        }
        var _stackableMethods = methods[memberName];
        if (!_.isArray(_stackableMethods)) {
            _stackableMethods = []
        }
        _stackableMethods.push(member);
        methods[memberName] = _stackableMethods;
        return methods
    }
    function _wizComposeMethods(composed, methods, methodName){
        if (!_.isArray(methods)) {
            throw new TypeError("#_wizComposeMethods: methods=`"+ methods +"` is not an array!")
        }
        if (!_.isString(methodName)) {
            throw new TypeError("#_wizComposeMethods: methodName=`"+ methodName +"` is not a string!")
        }
        if (_.size(methods) === 1) {
            composed[methodName] = _.first(methods);
            return composed
        }
        return _wizComposeMultiMethods(composed, methods, methodName)
    }
    function _wizComposeMultiMethods(composed, methods, methodName) {
        if (!_isPlainObject(composed)) {
            throw new TypeError("#_wizComposeMultiMethods: composed=`"+ composed +"` is not a plain object!")
        }
        if (!_.isArray(methods)) {
            throw new TypeError("#_wizComposeMultiMethods: methods=`"+ methods +"` is not an array!")
        }
        if (!_.isString(methodName)) {
            throw new TypeError("#_wizComposeMethods: methodName=`"+ methodName +"` is not a string!")
        }
        composed[methodName] = _composeToSingleFunction(methods);
        return composed
    }
    function _composeToSingleFunction(fns) {
        if (!_.isArray(fns)) {
            throw new TypeError("#_composeToSingleFunction: fns=`"+ fns +"` is not an array!")
        }
        var _fns = _.reduce(
                fns,
                function(memo, fn){
                    if (!_.isFunction(fn)) {
                        throw new TypeError("#_composeToSingleFunction: fn=`"+ fn +"` is not a function!")
                    }
                    var _fn;
                    if (!_.has(memo, 'prevFn')) {
                        _fn = exports._overridePropOnCall(fn, 'super')
                    } else {
                        _fn = exports._overridePropOnCall(fn, 'super', memo.prevFn)
                    }
                    memo.fns.push(_fn);
                    memo.prevFn = _fn;
                    return memo
                },
                {
                    fns:[]
                }
            ).fns;
        //noinspection UnnecessaryLocalVariableJS
        var result = _.last(_fns);
        return result
    }
    function _overridePropOnCall(fn, propName, overrideProp) {
        if (!_.isFunction(fn)) {
            throw new TypeError("#_overridePropOnCall: fn=`"+ fn +"` is not a function!")
        }
        if (!_.isString(propName)) {
            throw new TypeError("#_overridePropOnCall: propName=`"+ propName +"` is not a string!")
        }
        /**
         * if {@code overrideProp} is not passed, then it means, that
         * property by {@code propName} should be overridden via delete
         * (when the invocation happens, `_.has(this, propName) === false`)
         * */
        var _overrideViaDelete = arguments.length === 2;
        return function(){
            var _args = _.toArray(arguments),
                _self = this,
                _invokeWithContext = function(context){
                    return fn.apply(context, _args)
                };
            return exports._overrideAccountingPropExistence(_self, propName, overrideProp, _overrideViaDelete, _invokeWithContext)
        }
    }
    function _overrideAccountingPropExistence(obj, propName, overrideProp, overrideViaDelete, invokeWithContext){
        if (_.has(obj, propName)) {
            return exports._overrideWithContextSwitch(obj, propName, overrideProp, overrideViaDelete, invokeWithContext)
        }
        if (overrideViaDelete) {
            // no need to delete the property key, if it is to be overridden with a delete
            return invokeWithContext(obj)
        }
        return exports._overrideWithContextSwitch(obj, propName, overrideProp, overrideViaDelete, invokeWithContext)
    }
    function _overrideWithContextSwitch(obj, propName, overrideProp, overrideViaDelete, invokeWithContext){
        var _context = _.extend({}, obj);
        _context = exports._overrideProp(_context, propName, overrideViaDelete, overrideProp);
        return invokeWithContext(_context);
    }
    function _overrideProp(obj, propName, overrideViaDelete, overrideProp){
        if (overrideViaDelete) {
            return exports._overridePropViaDelete(obj, propName)
        }
        return exports._overridePropViaPut(obj, propName, overrideProp)
    }
    function _overridePropViaPut(obj, propName, overrideProp) {
        obj[propName] = overrideProp;
        return obj
    }
    function _overridePropViaDelete(obj, propName) {
        delete obj[propName];
        return obj
    }
    function _wizMixinMembersForClaz(members, clas) {
        if (!_.isFunction(clas)) {
            throw new TypeError("#_wizMixinMembersForClaz: clas=`"+ clas +"` is not a class factory function!")
        }
        if (!_isPlainObject(clas[_memberzPropName])) {
            throw new TypeError("#_wizMixinMembersForClaz: clas=`"+ clas +"` clas."+ _memberzPropName +"=`"+ claz[_memberzPropName] +"` is not the members object!")
        }
        members = _.reduce(
            clas[_memberzPropName],
            _wizMixinMember,
            members
        );
        return members
    }
    function _wizMixinMember(memberz, member, memberName){
        if (_.has(memberz, memberName)) {
            return memberz
        }
        if(_.isFunction(member)) {
            return memberz
        }
        if (_.isNull(member) || _.isUndefined(member) || _.isNaN(member)) {
            return memberz
        }
        memberz[memberName] = member;
        return memberz
    }

    var _ObjProto = Object.prototype,
        _toString = _ObjProto.toString,
        _ArrProto = Array.prototype,
        _slice = _ArrProto.slice,
        _memberzPropName = "memberz",
        _wizPropName = "wiz",

        exports = {
            claz: claz,
            wiz: wiz,

            /** exposing internals for testing purpose */
            _isPlainObject: _isPlainObject,
            _getPublicMembers: _getPublicMembers,
            _getInitFnOrNull: _getInitFnOrNull,
            _getInitFnFromMembersOrNull: _getInitFnFromMembersOrNull,
            _wizMixinMethodsForClaz: _wizMixinMethodsForClaz,
            _wizMixinMethod: _wizMixinMethod,
            _wizComposeMethods: _wizComposeMethods,
            _wizComposeMultiMethods: _wizComposeMultiMethods,
            _composeToSingleFunction: _composeToSingleFunction,
            _overridePropOnCall: _overridePropOnCall,
            _overrideAccountingPropExistence: _overrideAccountingPropExistence,
            _overrideWithContextSwitch: _overrideWithContextSwitch,
            _overrideProp: _overrideProp,
            _overridePropViaPut: _overridePropViaPut,
            _overridePropViaDelete: _overridePropViaDelete,
            _wizMixinMembersForClaz: _wizMixinMembersForClaz,
            _wizMixinMember: _wizMixinMember
        };
    return exports
});