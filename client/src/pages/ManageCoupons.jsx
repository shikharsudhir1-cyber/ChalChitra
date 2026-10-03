import CrudManager from "../components/CrudManager.jsx";

export default function ManageCoupons() {
    return (
        <CrudManager title="Manage Coupons" endpoint="/coupons" idKey="coupon_id"
            columns={[
                { key: "coupon_code", label: "Code" }, { key: "discount_type", label: "Type" },
                { key: "discount_value", label: "Value" }, { key: "valid_from", label: "From" },
                { key: "valid_until", label: "Until" }, { key: "usage_limit", label: "Limit" },
                { key: "used_count", label: "Used" }, { key: "is_active", label: "Active" },
            ]}
            fields={[
                { name: "coupon_code", label: "Code" },
                {
                    name: "discount_type", label: "Type", type: "select",
                    options: [{ value: "FLAT", label: "FLAT (₹)" }, { value: "PERCENT", label: "PERCENT (%)" }]
                },
                { name: "discount_value", label: "Value", type: "number" },
                { name: "valid_from", label: "Valid from", type: "date" },
                { name: "valid_until", label: "Valid until", type: "date" },
                { name: "usage_limit", label: "Usage limit", type: "number" },
                { name: "is_active", label: "Active", type: "checkbox" },
            ]} />
    );
}