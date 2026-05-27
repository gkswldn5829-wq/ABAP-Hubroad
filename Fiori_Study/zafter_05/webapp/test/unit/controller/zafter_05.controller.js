/*global QUnit*/

sap.ui.define([
	"zcl327/zafter05/controller/zafter_05.controller"
], function (Controller) {
	"use strict";

	QUnit.module("zafter_05 Controller");

	QUnit.test("I should test the zafter_05 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
