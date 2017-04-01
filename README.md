# ng-repeat-translate

This Directive is a wrapper of angular ng-repeat, designed to repeat translation keys defined as arrays.

## HOW IT WORKS

1. If translation key include angular expression, use single brace.
   (i.e {{type}} -> {type});

2. In case of using ng-include inside please replace: 'ng-include' 
   with 'include';

<ul>
	<li ng-repeat-translate="item in packs.{type}.features">
		<span include="'url_to_template.html'"></span>
		<span>{{item}}</span>
	</li>
</ul>

i18 JSON example: 
{
	"packs" : {
		"standart": {
			"title": "Fake text Fake text Fake text Fake text Fake text",
			"features": [
				"Fake text Fake text Fake text Fake text Fake text",
				"Fake text Fake text Fake text Fake text Fake text",
				"Fake text Fake text Fake text Fake text Fake text",
				"Fake text Fake text Fake text Fake text Fake text"
			]
		},
		"premium": {
			"title": "Fake text Fake text Fake text Fake text Fake text",
			"features": [
				"Fake text Fake text Fake text Fake text Fake text",
				"Fake text Fake text Fake text Fake text Fake text",
				"Fake text Fake text Fake text Fake text Fake text",
				"Fake text Fake text Fake text Fake text Fake text"
			]
		}
	}
}
