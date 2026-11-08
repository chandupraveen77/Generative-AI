import csv
import random

random.seed(42)

def generate_telco_churn(filepath: str, n_rows: int = 500):
    genders = ["Male", "Female"]
    partners = ["Yes", "No"]
    contracts = ["Month-to-month", "One year", "Two year"]
    
    rows = []
    # 15 indices where TotalCharges will be missing
    missing_total_indices = set(random.sample(range(n_rows), 15))
    # negative or zero tenure edge cases
    anomaly_tenure_indices = {5: -5, 12: -1, 23: 0, 48: 0, 99: -2}
    # unexpected categories in Contract
    anomaly_contract_indices = {18: "Unknown_Plan", 42: "Free-Trial-Lifetime", 77: "B2B_Legacy"}
    # Type mismatch or whitespace anomaly
    anomaly_gender_indices = {30: " Female ", 60: "MALE", 90: "fe-male"}
    
    for i in range(1, n_rows + 1):
        cust_id = f"CUST-{1000 + i}"
        gender = random.choice(genders)
        if i in anomaly_gender_indices:
            gender = anomaly_gender_indices[i]
            
        senior = 1 if random.random() < 0.16 else 0
        partner = random.choice(partners)
        
        tenure = random.randint(1, 72)
        if i in anomaly_tenure_indices:
            tenure = anomaly_tenure_indices[i]
            
        monthly_charges = round(random.uniform(18.25, 118.75), 2)
        
        # Outlier charge
        if i == 50:
            monthly_charges = 999.99
            
        if tenure > 0:
            total_charges = round(monthly_charges * tenure * random.uniform(0.95, 1.05), 2)
        else:
            total_charges = 0.0
            
        if i in missing_total_indices:
            total_str = ""
        else:
            total_str = str(total_charges)
            
        contract = random.choice(contracts)
        if i in anomaly_contract_indices:
            contract = anomaly_contract_indices[i]
            
        # Realistic churn distribution (~26% churn rate, higher for month-to-month and high monthly charges)
        churn_prob = 0.45 if contract == "Month-to-month" else 0.12
        if monthly_charges > 85:
            churn_prob += 0.15
        churn = "Yes" if random.random() < churn_prob else "No"
        
        # Injected duplicate or edge case
        rows.append({
            "CustomerID": cust_id,
            "Gender": gender,
            "SeniorCitizen": senior,
            "Partner": partner,
            "Tenure": tenure,
            "MonthlyCharges": monthly_charges,
            "TotalCharges": total_str,
            "Contract": contract,
            "Churn": churn
        })
        
    # Inject 2 duplicate rows to test uniqueness diagnostic
    rows.append(rows[10].copy())
    rows.append(rows[25].copy())
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["CustomerID", "Gender", "SeniorCitizen", "Partner", "Tenure", "MonthlyCharges", "TotalCharges", "Contract", "Churn"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} rows for {filepath}")

def generate_healthcare_stroke(filepath: str, n_rows: int = 500):
    genders = ["Male", "Female"]
    smoking_statuses = ["never smoked", "formerly smoked", "smokes", "Unknown"]
    
    missing_bmi_indices = set(random.sample(range(n_rows), 20))
    # Out of range glucose spikes
    anomaly_glucose_indices = {14: 388.5, 45: 489.2, 88: 999.0}
    # Inconsistent categorical labels in gender
    anomaly_gender_indices = {10: "FEMALE", 25: "Fem", 65: " Other ", 120: "male "}
    
    rows = []
    for i in range(1, n_rows + 1):
        rec_id = 10000 + i
        gender = random.choice(genders)
        if i in anomaly_gender_indices:
            gender = anomaly_gender_indices[i]
            
        age = round(random.uniform(18, 82), 1)
        if i == 5:
            age = -3.0 # Age anomaly
            
        hypertension = 1 if (age > 50 and random.random() < 0.25) else 0
        heart_disease = 1 if (age > 55 and random.random() < 0.18) else 0
        
        avg_glucose = round(random.gauss(105, 35), 2)
        if avg_glucose < 50:
            avg_glucose = 55.0
        if i in anomaly_glucose_indices:
            avg_glucose = anomaly_glucose_indices[i]
            
        bmi_val = round(random.gauss(28, 6), 1)
        if bmi_val < 15:
            bmi_val = 18.0
        if i == 33:
            bmi_val = 150.2 # Outlier BMI
            
        bmi_str = "" if i in missing_bmi_indices else str(bmi_val)
        
        smoking = random.choice(smoking_statuses)
        
        # Stroke label (imbalanced: ~5% overall, higher with age/glucose/hypertension)
        stroke_prob = 0.02
        if age > 60: stroke_prob += 0.08
        if avg_glucose > 180: stroke_prob += 0.09
        if hypertension == 1: stroke_prob += 0.05
        if heart_disease == 1: stroke_prob += 0.07
        stroke = 1 if random.random() < min(stroke_prob, 0.4) else 0
        
        rows.append({
            "id": rec_id,
            "gender": gender,
            "age": age,
            "hypertension": hypertension,
            "heart_disease": heart_disease,
            "avg_glucose_level": avg_glucose,
            "bmi": bmi_str,
            "smoking_status": smoking,
            "stroke": stroke
        })
        
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "gender", "age", "hypertension", "heart_disease", "avg_glucose_level", "bmi", "smoking_status", "stroke"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} rows for {filepath}")

if __name__ == "__main__":
    generate_telco_churn("C:/Users/chand/.gemini/antigravity/scratch/dataqualai/backend/sample_data/telco_churn_sample.csv")
    generate_healthcare_stroke("C:/Users/chand/.gemini/antigravity/scratch/dataqualai/backend/sample_data/healthcare_stroke_sample.csv")
