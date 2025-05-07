from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.associationproxy import association_proxy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Initialize SQLAlchemy
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    # Relationships
    expenses = db.relationship('Expense', back_populates='user', cascade='all, delete-orphan')
    paychecks = db.relationship('Paycheck', back_populates='user', cascade='all, delete-orphan')
    
    # Association proxies 
    time_periods_via_expenses = association_proxy('expenses', 'time_period')
    time_periods_via_paychecks = association_proxy('paychecks', 'time_period')
    
    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class TimePeriod(db.Model):
    __tablename__ = 'time_periods'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False, unique=True)  # Add unique constraint
    
    # Relationships
    expenses = db.relationship('Expense', back_populates='time_period', cascade='all, delete-orphan')
    paychecks = db.relationship('Paycheck', back_populates='time_period', cascade='all, delete-orphan')
    
    # # Association proxies
    # users_via_expenses = association_proxy('expenses', 'user')
    # users_via_paychecks = association_proxy('paychecks', 'user')
    
    def __repr__(self):
        return f'<TimePeriod {self.type}>'
    


class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    time_period_id = db.Column(db.Integer, db.ForeignKey('time_periods.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.Date, nullable=True)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_interval = db.Column(db.String(50), nullable=True)
    category = db.Column(db.String(80), nullable=True)
    currency = db.Column(db.String(3), default='USD')
    
    # Relationships
    user = db.relationship('User', back_populates='expenses')
    time_period = db.relationship('TimePeriod', back_populates='expenses')
    
    def __repr__(self):
        return f'<Expense {self.description}: {self.amount}>'

class Paycheck(db.Model):
    __tablename__ = 'paychecks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    time_period_id = db.Column(db.Integer, db.ForeignKey('time_periods.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date_received = db.Column(db.Date, nullable=True)
    currency = db.Column(db.String(3), default='USD')
    
    # Relationships
    user = db.relationship('User', back_populates='paychecks')
    time_period = db.relationship('TimePeriod', back_populates='paychecks')
    
    def __repr__(self):
        return f'<Paycheck {self.amount} on {self.date_received}>'