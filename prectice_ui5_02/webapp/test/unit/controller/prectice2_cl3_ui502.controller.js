/*global QUnit*/

sap.ui.define([
	"codecl3/preticeui502/controller/prectice2_cl3_ui502.controller"
], function (Controller) {
	"use strict";

	QUnit.module("prectice2_cl3_ui502 Controller");

	QUnit.test("I should test the prectice2_cl3_ui502 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
