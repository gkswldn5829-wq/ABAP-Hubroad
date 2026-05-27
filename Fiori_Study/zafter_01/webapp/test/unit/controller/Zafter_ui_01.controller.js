/*global QUnit*/

sap.ui.define([
	"zcl327/zafter01/controller/Zafter_ui_01.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Zafter_ui_01 Controller");

	QUnit.test("I should test the Zafter_ui_01 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
