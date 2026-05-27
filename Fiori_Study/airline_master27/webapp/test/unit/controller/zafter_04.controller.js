/*global QUnit*/

sap.ui.define([
	"zcl327/airlinemaster27/controller/zafter_04.controller"
], function (Controller) {
	"use strict";

	QUnit.module("zafter_04 Controller");

	QUnit.test("I should test the zafter_04 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
