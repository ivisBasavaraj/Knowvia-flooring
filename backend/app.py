from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient
import os
from datetime import datetime

# Import configuration and routes
from config import Config
from routes.auth_routes import auth_bp
from routes.floorplan_routes import floorplan_bp
from routes.dashboard_routes import dashboard_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    jwt = JWTManager(app)
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # Test MongoDB connection
    try:
        client = MongoClient(Config.MONGODB_URI)
        db = client.get_default_database()
        # Test connection
        db.command('ping')
        print("✅ MongoDB connection successful")
        
        # Create indexes for better performance
        db.users.create_index([("username", 1)], unique=True)
        db.users.create_index([("email", 1)], unique=True)
        db.floorplans.create_index([("name", 1)])
        db.floorplans.create_index([("user_id", 1)])
        db.floorplans.create_index([("event_id", 1)])
        db.floorplans.create_index([("last_modified", -1)])
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return None
    
    # Register API blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(floorplan_bp, url_prefix='/api')
    
    # Register dashboard blueprint
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        try:
            # Test database connection
            client = MongoClient(Config.MONGODB_URI)
            db = client.get_default_database()
            db.command('ping')
            
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'database': 'connected',
                'version': '1.0.0'
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'timestamp': datetime.utcnow().isoformat(),
                'database': 'disconnected',
                'error': str(e)
            }), 500
    
    # Root endpoint
    @app.route('/')
    def root():
        return jsonify({
            'message': 'IMTMA Flooring Backend API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'floorplans': '/api/floorplans',
                'dashboard': '/dashboard',
                'health': '/health'
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'Internal server error'}), 500
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Authorization token is required'}), 401
    
    return app

if __name__ == '__main__':
    app = create_app()
    if app:
        print("🚀 Starting IMTMA Flooring Backend...")
        print(f"📊 Dashboard available at: http://localhost:5000/dashboard")
        print(f"🔗 API available at: http://localhost:5000/api")
        print(f"💚 Health check: http://localhost:5000/health")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("❌ Failed to start application - check MongoDB connection")