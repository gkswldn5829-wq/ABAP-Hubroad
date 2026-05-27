/*global QUnit*/

sap.ui.define([
	"cl327/zafter02/controller/zafter_02.controller"
], function (Controller) {
	"use strict";

	QUnit.module("zafter_02 Controller");

	QUnit.test("I should test the zafter_02 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
