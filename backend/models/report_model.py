from datetime import datetime
from extensions import db

class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)

    inspection_file = db.Column(db.String(255), nullable=False)
    thermal_file = db.Column(db.String(255), nullable=False)

    ddr_output = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "inspection_file": self.inspection_file,
            "thermal_file": self.thermal_file,
            "ddr_output": self.ddr_output,
            "created_at": self.created_at
        }