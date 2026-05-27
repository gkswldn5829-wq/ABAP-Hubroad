/*global QUnit*/

sap.ui.define([
	"cl3/jiwoo/purchasing/controller/PurchasingView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("PurchasingView Controller");

	QUnit.test("I should test the PurchasingView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
