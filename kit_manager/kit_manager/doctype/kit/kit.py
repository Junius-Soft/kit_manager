# Copyright (c) 2024, kit_management and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt


class Kit(Document):
	def validate(self):
		self.calculate_totals()
	
	def after_insert(self):
		self.update_kit_price_in_price_list()
	
	def on_update(self):
		self.update_kit_price_in_price_list()
	
	def on_trash(self):
		self.delete_kit_price_from_price_list()
	
	def update_kit_price_in_price_list(self):
		"""Update or create Item Price for kit_name in Bayi Fiyat price list"""
		if not self.kit_name:
			return
		
		price_list_name = "Bayi Fiyat"
		kit_price = flt(self.kit_price or 0)
		
		if not frappe.db.exists("Price List", price_list_name):
			try:
				price_list_doc = frappe.get_doc({
					"doctype": "Price List",
					"price_list_name": price_list_name,
					"enabled": 1,
					"buying": 0,
					"selling": 1,
					"currency": "TRY"
				})
				price_list_doc.insert(ignore_permissions=True)
				frappe.msgprint(
					f"'{price_list_name}' fiyat listesi oluşturuldu.",
					alert=True,
					indicator="green"
				)
			except Exception as e:
				frappe.log_error(
					f"Error creating Price List '{price_list_name}': {str(e)}",
					"Price List Creation Error"
				)
				return
		
		existing_price = frappe.db.get_value(
			"Item Price",
			{
				"item_code": self.kit_name,
				"price_list": price_list_name
			},
			["name", "price_list_rate"],
			as_dict=True
		)
		
		if existing_price:
			if flt(existing_price.price_list_rate) != kit_price:
				frappe.db.set_value(
					"Item Price",
					existing_price.name,
					"price_list_rate",
					kit_price
				)
				frappe.msgprint(
					f"Bayi Fiyatı güncellendi: {self.kit_name} = ₺{kit_price:,.2f}",
					alert=True,
					indicator="blue"
				)
		else:
			try:
				item_price = frappe.get_doc({
					"doctype": "Item Price",
					"item_code": self.kit_name,
					"price_list": price_list_name,
					"price_list_rate": kit_price
				})
				item_price.insert(ignore_permissions=True)
				frappe.msgprint(
					f"Bayi Fiyatı eklendi: {self.kit_name} = ₺{kit_price:,.2f}",
					alert=True,
					indicator="green"
				)
			except Exception as e:
				frappe.log_error(
					f"Error creating Item Price for {self.kit_name}: {str(e)}",
					"Kit Price Update Error"
				)
				frappe.msgprint(
					f"Bayi Fiyatı eklenirken hata oluştu. Lütfen sistem yöneticisine başvurun.",
					alert=True,
					indicator="red"
				)
	
	def delete_kit_price_from_price_list(self):
		"""Delete Item Price for kit_name from Bayi Fiyat price list"""
		if not self.kit_name:
			return
		
		price_list_name = "Bayi Fiyat"
		
		item_price_name = frappe.db.get_value(
			"Item Price",
			{
				"item_code": self.kit_name,
				"price_list": price_list_name
			},
			"name"
		)
		
		if item_price_name:
			try:
				frappe.delete_doc("Item Price", item_price_name, force=True, ignore_permissions=True)
				frappe.msgprint(
					f"Bayi Fiyatı silindi: {self.kit_name}",
					alert=True,
					indicator="orange"
				)
			except Exception as e:
				frappe.log_error(
					f"Error deleting Item Price for {self.kit_name}: {str(e)}",
					"Kit Price Deletion Error"
				)
	
	def calculate_totals(self):
		"""Calculate total amount, discount, tax and grand total"""
		total_amount = 0
		
		for item in self.items:
			qty = flt(item.quantity)
			rate = flt(item.rate)
			if qty and rate:
				item.amount = qty * rate
				total_amount += item.amount
		
		self.total_amount = total_amount
		
		discount_pct = flt(self.discount_percentage or 0)
		self.discount_amount = total_amount * (discount_pct / 100.0) if discount_pct else 0
		
		amount_after_discount = total_amount - self.discount_amount
		
		tax_pct = flt(self.tax_percentage or 18)
		self.tax_percentage = tax_pct
		self.tax_amount = amount_after_discount * (tax_pct / 100.0) if tax_pct else 0
		
		self.grand_total = amount_after_discount + self.tax_amount
		
		base_for_additional_costs = self.grand_total
		
		profit_pct = flt(self.profit_percentage or 0)
		self.profit_amount = base_for_additional_costs * (profit_pct / 100.0) if profit_pct else 0
		
		overhead_pct = flt(self.overhead_percentage or 0)
		self.overhead_amount = base_for_additional_costs * (overhead_pct / 100.0) if overhead_pct else 0
		
		labor_pct = flt(self.labor_percentage or 0)
		self.labor_amount = base_for_additional_costs * (labor_pct / 100.0) if labor_pct else 0
		
		yearend_bonus_pct = flt(self.yearend_bonus_percentage or 0)
		self.yearend_bonus_amount = base_for_additional_costs * (yearend_bonus_pct / 100.0) if yearend_bonus_pct else 0
		
		self.final_total = (
			self.grand_total + 
			self.profit_amount + 
			self.overhead_amount + 
			self.labor_amount + 
			self.yearend_bonus_amount
		)
		
		self.kit_price = self.final_total


@frappe.whitelist()
def on_item_price_update(doc, method=None):
	"""Called when Item Price is updated - Updates all Kits that contain this item"""
	if doc.price_list != "Standard Buying":
		return
	
	item_code = doc.item_code
	new_price = flt(doc.price_list_rate)
	
	kits_with_item = frappe.db.sql("""
		SELECT DISTINCT parent
		FROM `tabKit Item`
		WHERE item_code = %s
		AND parenttype = 'Kit'
	""", (item_code,), as_dict=True)
	
	if not kits_with_item:
		return
	
	updated_kits = []
	
	for kit_row in kits_with_item:
		kit_name = kit_row.parent
		
		try:
			kit = frappe.get_doc("Kit", kit_name)
			old_kit_price = flt(kit.kit_price)
			
			price_changed = False
			for kit_item in kit.items:
				if kit_item.item_code == item_code:
					old_rate = flt(kit_item.rate)
					if old_rate != new_price:
						kit_item.rate = new_price
						price_changed = True
			
			if price_changed:
				kit.calculate_totals()
				kit.flags.ignore_permissions = True
				kit.save()
				
				updated_kits.append({
					"kit_name": kit_name,
					"item_code": item_code,
					"old_price": old_kit_price,
					"new_price": flt(kit.kit_price)
				})
				
		except Exception as e:
			frappe.log_error(
				f"Error updating Kit {kit_name} after Item Price change: {str(e)}",
				"Kit Auto Update Error"
			)
	
	if updated_kits:
		message = f"<b>{len(updated_kits)} Kit güncellendi:</b><br><br>"
		for kit in updated_kits:
			price_change = flt(kit['new_price']) - flt(kit['old_price'])
			message += f"• {kit['kit_name']}: ₺{kit['old_price']:,.2f} → ₺{kit['new_price']:,.2f} "
			message += f"(<span style='color:{'green' if price_change > 0 else 'red'}'>{'↑' if price_change > 0 else '↓'} ₺{abs(price_change):,.2f}</span>)<br>"
		
		frappe.msgprint(
			message,
			title="Kit Fiyatları Güncellendi",
			indicator="blue"
		)
