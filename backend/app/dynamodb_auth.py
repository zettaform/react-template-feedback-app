import boto3
import os
from typing import Optional
from .models import UserInDB
from botocore.exceptions import ClientError

class DynamoDBAuth:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.table_name = 'Customers'
        self.table = self.dynamodb.Table(self.table_name)
    
    def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user from DynamoDB customers table by email"""
        try:
            response = self.table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('email').eq(email)
            )
            
            items = response.get('Items', [])
            if not items:
                return None
            
            customer = items[0]  # Take first match
            
            # Map DynamoDB customer to UserInDB format
            return UserInDB(
                username=customer.get('email', ''),  # Use email as username
                email=customer.get('email', ''),
                full_name=f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
                hashed_password=customer.get('password', ''),  # Assuming password field exists
                disabled=False,
                avatar='goku.png',  # Default avatar
                onboarding_completed=True
            )
            
        except ClientError as e:
            print(f"DynamoDB error: {e}")
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        """Get user by username (which is email in our case)"""
        return self.get_user_by_email(username)

# Create singleton instance
dynamodb_auth = DynamoDBAuth()
