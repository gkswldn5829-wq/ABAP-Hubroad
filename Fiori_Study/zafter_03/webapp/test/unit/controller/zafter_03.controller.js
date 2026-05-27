/*global QUnit*/

sap.ui.define([
	"zafter03/zafter03/controller/zafter_03.controller"
], function (Controller) {
	"use strict";

	QUnit.module("zafter_03 Controller");

	QUnit.test("I should test the zafter_03 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
