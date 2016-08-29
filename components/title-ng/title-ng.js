/**
 * @name Title Ng
 * @category Angular Components
 * @description TODO
 * @example
   <example name="Title Ng">
    <file name="index.html">
      TODO example
    </file>
   </example>
 */
/* global angular: false */

const angularModule = angular.module('Ring.title', []);

angularModule.directive('rgPageTitle', () => ({
  scope: {
    rgPageTitle: '@',
    noTitle: '@',
    delimiter: '@'
  },

  controller($rootScope, $scope, $element, pageTitle, $injector) {
    const element = $element[0];

    pageTitle.setDelimiter($scope.delimiter);

    // Get title prefix from title element
    const elementText = element.textContent;

    // Set page title on route change
    const off = $rootScope.$on('$routeChangeSuccess', (event, current) => {
      let title = current.$$route && current.$$route.title; // eslint-disable-line angular/no-private-call

      pageTitle.setCurrent($scope.rgPageTitle || elementText);

      // Use title: false to prevent title change on route
      if (title !== false) {
        if (angular.isArray(title) || angular.isFunction(title)) {
          //Invoke injector
          title = $injector.invoke(title);
        }
        pageTitle.addElement(title || $scope.noTitle);
      }
    });

    $scope.$on('$destroy', off);
  }
}));

angularModule.service('pageTitle', function ($interpolate) {
  let delimiter = ' | ';
  let current = document.title;

  function setTitle(text) {
    current = text && $interpolate(text)();
    document.title = current;
  }

  function prepend(element) {
    setTitle(current ? element + delimiter + current : element);
  }

  function replaceFirst(element) {
    const titleElements = current.split(delimiter);
    titleElements[0] = element;

    setTitle(titleElements.join(delimiter));
  }

  this.setDelimiter = newDelimiter => {
    delimiter = newDelimiter || delimiter;
  };

  this.setCurrent = newBase => {
    current = newBase;
  };

  this.addElement = (element, fieldName) => {
    if (element.$promise) {
      element.$promise.then(Data => {
        this.addElement(Data[fieldName || 'name']);
      });
    } else {
      prepend(fieldName ? element[fieldName] : element);
    }
  };

  this.updateElement = (element, fieldName) => {
    if (element.$promise) {
      element.$promise.then(Data => {
        this.updateElement(Data[fieldName || 'name']);
      });
    } else {
      replaceFirst(fieldName ? element[fieldName] : element);
    }
  };
});

export default angularModule.name;
