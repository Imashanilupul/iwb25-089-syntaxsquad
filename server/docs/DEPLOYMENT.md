# Deployment Guide

## Overview
This guide covers deploying the Transparent Governance Platform backend in different environments.

## Environment Setup

### Development
1. Copy `.env.template` to `Config.toml` (or use existing Config.toml)
2. Update with your development Supabase credentials
3. Run with `bal run`

### Production
1. Set environment variables in your deployment platform
2. Use production Supabase credentials
3. Enable proper security settings
4. Configure CORS for your frontend domain

## Docker Deployment (Optional)

Create a Dockerfile:
```dockerfile
FROM ballerina/ballerina:2201.12.7

WORKDIR /app
COPY . .

RUN bal build

EXPOSE 8080

CMD ["java", "-jar", "target/bin/server_bal.jar"]
```

Build and run:
```bash
docker build -t governance-platform .
docker run -p 8080:8080 -e SUPABASE_URL=your-url -e SUPABASE_SERVICE_ROLE_KEY=your-key governance-platform
```

## Environment Variables

### Required
- `port`: Server port (default: 8080)
- `supabaseUrl`: Your Supabase project URL
- `supabaseServiceRoleKey`: Service role key for database operations

### Security Considerations
1. Never commit actual credentials to version control
2. Use environment-specific configuration files
3. Rotate API keys regularly
4. Enable proper CORS settings for production
5. Use HTTPS in production

## Health Checks

The application provides several health check endpoints:
- `/api/health` - Basic application health
- `/api/db/health` - Database connectivity
- `/api/status` - Detailed server status

## Monitoring

Monitor these endpoints for production deployment:
- Response times on `/api/health`
- Database connection status via `/api/db/health`
- Application logs for errors and warnings
- HTTP status codes and error rates

## Scaling

The application is stateless and can be horizontally scaled:
1. Deploy multiple instances behind a load balancer
2. Use sticky sessions if needed (though not required)
3. Monitor database connection pool limits
4. Consider caching for frequently accessed data

## Backup and Recovery

1. **Database**: Supabase handles automated backups
2. **Configuration**: Keep Config.toml in version control (without secrets)
3. **Application State**: Application is stateless, no additional backup needed

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Supabase URL and service role key
   - Verify Supabase project is active
   - Check network connectivity

2. **Permission Denied**
   - Verify service role key has proper permissions
   - Check Row Level Security (RLS) settings in Supabase

3. **CORS Errors**
   - Update allowed origins in configuration
   - Verify frontend URL matches CORS settings

### Debugging Steps

1. Check health endpoints:
   ```bash
   curl http://localhost:8080/api/health
   curl http://localhost:8080/api/db/health
   ```

2. Review application logs for errors

3. Verify configuration values are loaded correctly:
   ```bash
   curl http://localhost:8080/api/info
   ```

4. Test database connectivity manually using Supabase dashboard

## Performance Optimization

1. **Connection Pooling**: Handled by Supabase
2. **Caching**: Consider implementing Redis for frequently accessed data
3. **Database Indexing**: Ensure proper indexes on frequently queried columns
4. **Query Optimization**: Use Supabase's query analysis tools

## Security Hardening

1. **API Keys**: Use least-privilege service role keys
2. **CORS**: Restrict to specific domains in production
3. **Rate Limiting**: Implement API rate limiting
4. **Input Validation**: Validate all input data
5. **HTTPS**: Use HTTPS in production
6. **Logging**: Log security events and API access
