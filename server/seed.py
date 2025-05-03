from app import create_app
from models import db, User, TimePeriod, Expense, Paycheck
from datetime import datetime, timedelta

def seed_database():
    print("Seeding database...")
    
    # Create app context
    app = create_app()
    with app.app_context():
        # Clean database
        db.drop_all()
        db.create_all()
        
        # Create users
        user1 = User(username="test_user")
        user1.password = "password123"
        
        user2 = User(username="demo_user")
        user2.password = "demo123"
        
        db.session.add_all([user1, user2])
        db.session.commit()
        
        bi_weekly = TimePeriod(type="bi-weekly")
        monthly = TimePeriod(type="monthly")
        yearly = TimePeriod(type="yearly")

        db.session.add_all([bi_weekly, monthly, yearly])
        db.session.commit()
        
        # Create expenses for user1
        expenses = [
            Expense(
                user_id=user1.id,
                time_period_id=bi_monthly_1.id,
                description="Rent",
                amount=1000.00,
                due_date=datetime(2025, 1, 5).date(),
                is_recurring=True,
                recurrence_interval="monthly",
                category="Housing",
                currency="USD"
            ),
            Expense(
                user_id=user1.id,
                time_period_id=bi_monthly_1.id,
                description="Groceries",
                amount=200.00,
                due_date=datetime(2025, 1, 10).date(),
                is_recurring=False,
                category="Food",
                currency="USD"
            ),
            Expense(
                user_id=user1.id,
                time_period_id=bi_monthly_2.id,
                description="Utilities",
                amount=150.00,
                due_date=datetime(2025, 1, 20).date(),
                is_recurring=True,
                recurrence_interval="monthly",
                category="Utilities",
                currency="USD"
            ),
            Expense(
                user_id=user1.id,
                time_period_id=monthly_1.id,
                description="Car Insurance",
                amount=80.00,
                due_date=datetime(2025, 1, 15).date(),
                is_recurring=True,
                recurrence_interval="monthly",
                category="Insurance",
                currency="USD"
            ),
            Expense(
                user_id=user1.id,
                time_period_id=yearly_1.id,
                description="Property Tax",
                amount=2500.00,
                due_date=datetime(2025, 4, 15).date(),
                is_recurring=True,
                recurrence_interval="yearly",
                category="Taxes",
                currency="USD"
            )
        ]
        
        db.session.add_all(expenses)
        db.session.commit()
        
        # Create paychecks for user1
        paychecks = [
            Paycheck(
                user_id=user1.id,
                time_period_id=bi_monthly_1.id,
                amount=1500.00,
                date_received=datetime(2025, 1, 1).date(),
                currency="USD"
            ),
            Paycheck(
                user_id=user1.id,
                time_period_id=bi_monthly_2.id,
                amount=1500.00,
                date_received=datetime(2025, 1, 15).date(),
                currency="USD"
            )
        ]
        
        db.session.add_all(paychecks)
        db.session.commit()
        
        # Create some expenses and paychecks for user2
        expenses_user2 = [
            Expense(
                user_id=user2.id,
                time_period_id=monthly_1.id,
                description="Rent",
                amount=800.00,
                due_date=datetime(2025, 1, 1).date(),
                is_recurring=True,
                recurrence_interval="monthly",
                category="Housing",
                currency="USD"
            ),
            Expense(
                user_id=user2.id,
                time_period_id=monthly_1.id,
                description="Streaming Services",
                amount=50.00,
                due_date=datetime(2025, 1, 15).date(),
                is_recurring=True,
                recurrence_interval="monthly",
                category="Entertainment",
                currency="USD"
            )
        ]
        
        db.session.add_all(expenses_user2)
        db.session.commit()
        
        paycheck_user2 = Paycheck(
            user_id=user2.id,
            time_period_id=monthly_1.id,
            amount=2000.00,
            date_received=datetime(2025, 1, 1).date(),
            currency="USD"
        )
        
        db.session.add(paycheck_user2)
        db.session.commit()
        
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database()