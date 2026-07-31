import json
import os


class ScoringEngine:
    def __init__(self):
        self.interviewers_data_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "interview_data", "interviewers.json"
        )
        with open(self.interviewers_data_path, "r") as f:
            self.interviewers = json.load(f)

    def get_interviewer(self, company):
        return self.interviewers.get(company.lower(), None)

    def get_questions(self, company):
        data = self.get_interviewer(company)
        if data:
            return data.get("questions", [])
        return [
            "Tell me about yourself.",
            "Why are you interested in this role?",
            "What are your strengths and weaknesses?",
            "Describe a challenging project you worked on.",
            "Where do you see yourself in five years?",
        ]

    def get_interviewer_persona(self, company):
        data = self.get_interviewer(company)
        if data:
            return {
                "name": data.get("name", f"{company.title()} Interviewer"),
                "style": data.get("style", "professional"),
                "tone": data.get("tone", "formal"),
                "focusAreas": data.get("focusAreas", []),
            }
        return {
            "name": "General Interviewer",
            "style": "professional",
            "tone": "formal",
            "focusAreas": ["communication", "experience", "skills"],
        }

    def calculate_hiring_probability(self, scores):
        weights = {
            "confidenceScore": 0.25,
            "communicationScore": 0.25,
            "grammarScore": 0.15,
            "bodyLanguageScore": 0.15,
            "voiceScore": 0.20,
        }
        total = 0.0
        weight_sum = 0.0
        for key, weight in weights.items():
            value = scores.get(key, 0)
            total += value * weight
            weight_sum += weight
        if weight_sum > 0:
            probability = (total / weight_sum) * 100
        else:
            probability = 0.0
        return round(min(max(probability, 0.0), 99.9), 1)

    def generate_score_report(self, scores, company):
        hiring_prob = self.calculate_hiring_probability(scores)
        if hiring_prob >= 80:
            recommendation = "Strong candidate - highly likely to be hired"
        elif hiring_prob >= 65:
            recommendation = "Good candidate - has a strong chance"
        elif hiring_prob >= 45:
            recommendation = "Moderate candidate - areas for improvement"
        elif hiring_prob >= 25:
            recommendation = "Below average - needs significant improvement"
        else:
            recommendation = "Poor performance - not recommended for this role"

        return {
            "company": company,
            "interviewer": self.get_interviewer_persona(company),
            "scores": scores,
            "hiringProbability": hiring_prob,
            "recommendation": recommendation,
            "breakdown": {
                "confidenceLevel": scores.get("confidenceScore", 0),
                "communicationQuality": scores.get("communicationScore", 0),
                "grammarAndClarity": scores.get("grammarScore", 0),
                "physicalPresence": scores.get("bodyLanguageScore", 0),
                "voiceQuality": scores.get("voiceScore", 0),
            },
        }


if __name__ == "__main__":
    engine = ScoringEngine()
    scores = {
        "confidenceScore": 78.5,
        "communicationScore": 82.0,
        "grammarScore": 75.0,
        "bodyLanguageScore": 88.0,
        "voiceScore": 70.5,
    }
    report = engine.generate_score_report(scores, "google")
    print(json.dumps(report, indent=2))