# ng-repeat-translate

This Directive is a wrapper of angular ng-repeat, designed to repeat translation keys defined as arrays.

## HOW IT WORKS
```
<ul>
    <li ng-repeat-translate="item in packs.{{type}}.features">
        <span>{{item}}</span>
    </li>
</ul>

i18 JSON example: 
{
    "packs" : {
        "standart": {
            "title": "Standard feature title",
            "features": [
                "Feature 1",
                "Feature 2",
                "Feature 4",
                "Feature 5"
            ]
        },
        "premium": {
            "title": "Premium feature title",
            "features": [
                "Feature 1",
                "Feature 2",
                "Feature 4",
                "Feature 5"
            ]
        }
    }
};
```
