# Copyright (c) 2024, kit_management and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt


class KitItem(Document):
	def validate(self):
		"""Calculate amount before saving"""
		self.calculate_amount()
	
	def calculate_amount(self):
		"""Calculate amount = quantity * rate"""
		qty = flt(self.quantity)
		rate = flt(self.rate)
		self.amount = qty * rate


