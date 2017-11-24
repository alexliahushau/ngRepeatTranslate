'use strict';

angular.module('filApp')
    .directive('ngRepeatTranslate', function($translatePartialLoader, $translate, $timeout, $compile, $q) {
        return {
            compile: function($elem, $attr) {

                /** Declaration section */
                var args = $attr.ngRepeatTranslate.split(' ');
                var itemName = args[0];
                var translationKey = args[2];
                var i18jsonName = translationKey.split('.')[0];
                var optionalVars;
                var disabledElements = [];


                /** Methods section */
                var getVariablesFromString = function(str) {
                    return _.map(str.match(/{{.*?}}/g), function(item) {
                        return item.replace(/{{|}}/g, '');
                    });
                };

                var getAllNgAttributes = function (elem) {
                    var result = [];
                    if (!elem) {
                        return result;
                    }

                    var regexp = new RegExp(/^ng-*/i);

                    var childElements = elem.children();
                    if (childElements && childElements.length) {
                        _.forEach(childElements, function (element) {
                            result = _.union(result, getAllNgAttributes($(element)));
                        });
                    }

                    elem.each(function () {
                        $.each(this.attributes, function () {
                            var name = this.name;
                            if (regexp.test(name) && name !== 'ng-repeat-translate') {
                                result.push(this.name);
                            }
                        });
                    });

                    return result;
                };

                disabledElements = getAllNgAttributes($elem);

                var getTemporaryName = function (originalName) {
                    return originalName.replace(/\-/g, '');
                };

                /** Init section */
                _.forEach(disabledElements, function (element) {
                    _.forEach($elem.find('[' + element + ']'), function (elem) {
                        $(elem).attr(getTemporaryName(element), $(elem).attr(element));
                        $(elem).removeAttr(element);
                    });
                });

                optionalVars = getVariablesFromString(translationKey);

                var generateUniqueArrayName = function (pattern) {
                    var timestamp = new Date().getUTCMilliseconds();
                    return pattern + '_' + Math.pow(timestamp, 2) + Math.random().toString(36).substr(2);
                };

                return {
                    post: function($scope, $elem){

                        /** Declaration section */
                        var clone = $elem.clone();
                        var promises = [];
                        var filledTranslationKey;
                        var translationName = generateUniqueArrayName('translations');
                        $scope[translationName] = [];

                        /** Methods section */
                        var checkScope = function() {
                            var scopeArgs = {};
                            _.forEach(optionalVars, function(optVar) {
                                if (optVar.split('.').length > 1) {
                                    _.forEach(optVar.split('.'), function(item) {
                                        scopeArgs[optVar] = scopeArgs[optVar]
                                            ? item.indexOf('()') === -1
                                                ? scopeArgs[optVar][item] : scopeArgs[optVar][item.replace('()', '')]()
                                            : $scope[item];
                                    });
                                } else {
                                    scopeArgs[optVar] = $scope[optVar];
                                }
                            });
                            return scopeArgs;
                        };

                        var isTranslationKeyResolved = function() {
                            return _.isEmpty(getVariablesFromString($attr.ngRepeatTranslate.split(' ')[2]));
                        };

                        var validateOptionals = function(cancelTimeout) {
                            var deffered = $q.defer();
                            promises.push(deffered.promise);

                            var timer = $timeout(function() {
                                watcher();
                                deffered.resolve();
                            }, cancelTimeout || 500);

                            var watcher = $scope.$watch(function() {
                                return _.size(checkScope()) === _.size(optionalVars);
                            }, function(ready) {
                                if (ready) {
                                    watcher();
                                    $timeout.cancel(timer);
                                    deffered.resolve();
                                }
                            });
                        };

                        var updateTranslation = function() {
                            $translatePartialLoader.addPart(i18jsonName);
                            promises.push($translate.refresh());
                        };

                        var translationKeyFillArgs = function() {
                            filledTranslationKey = translationKey;
                            _.forEach(checkScope(), function(value, key) {
                                filledTranslationKey = filledTranslationKey.replace('{{' + key + '}}', value);
                            });
                        };

                        var translateArray = function(cancelTimeout) {
                            var hasNext = true;
                            var i = 0;
                            var timer = $timeout(function() {
                                hasNext = false;
                            },cancelTimeout || 500);

                            while(hasNext) {
                                var key = filledTranslationKey + '.' + i;
                                var value = $translate.instant(key);
                                if (key == value) {
                                    hasNext = false;
                                } else {
                                    $scope[translationName].push(value);
                                    i++;
                                }
                            }
                            $timeout.cancel(timer);
                        };

                        var compileToScope = function() {
                            clone.removeAttr('ng-repeat-translate');
                            clone.attr('ng-repeat', itemName + " in " + translationName + " track by $index");

                            _.forEach(disabledElements, function (element) {
                                var tmpName = getTemporaryName(element);
                                _.forEach(clone.find('[' + tmpName + ']'), function (elem) {
                                    $(elem).attr(element, $(elem).attr(tmpName));
                                    $(elem).removeAttr(tmpName);
                                });
                            });

                            $compile(clone)($scope);
                            $elem.replaceWith(clone);
                        };

                        var init = function() {
                            updateTranslation();
                            if (!isTranslationKeyResolved()) validateOptionals();
                            $q.all(promises).then(function() {
                                translationKeyFillArgs();
                                translateArray();
                                compileToScope();
                                enableScopeWatcher();
                            });
                        };

                        var isScopeVarsChanged = function(scopeStamp) {
                            return _.some(checkScope(), function(value, key) {
                                return scopeStamp[key] !== value;
                            });
                        };


                        /** Watchers section */
                        var enableScopeWatcher = function() {
                            var scopeStamp = checkScope();
                            $scope.$watch(function() {
                                return isScopeVarsChanged(scopeStamp);
                            }, function(hasChanges) {
                                if (hasChanges) {
                                    scopeStamp = checkScope();
                                    $scope[translationName] = [];
                                    translationKeyFillArgs();
                                    translateArray();
                                }
                            });
                        };


                        /** Init section */
                        init();

                    }
                };
            }
        };
});
